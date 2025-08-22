import { Resend } from "resend"
import { randomBytes } from "crypto"
import { db } from "./database"
import bcrypt from "bcryptjs"

let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend && process.env.RESEND_API_KEY_CSS) {
    resend = new Resend(process.env.RESEND_API_KEY_CSS)
  }
  return resend!
}

async function safeEmailOperation<T>(operation: () => Promise<T>): Promise<T | { success: false; error: string }> {
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY_CSS) {
    console.warn("Resend API key not available during build")
    return { success: false, error: "Email service not available during build" } as any
  }
  return operation()
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  return safeEmailOperation(async () => {
    try {
      // Generate verification token
      const token = randomBytes(32).toString("hex")

      // Store token in database
      await db.oneTimeToken.create({
        userId,
        purpose: "VERIFY_EMAIL",
        tokenHash: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })

      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${token}`

      const { data, error } = await getResendClient().emails.send({
        from: "Crafted Surface Solutions <noreply@craftedsurfacesolutions.com>",
        to: [email],
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #166534;">Welcome to Crafted Surface Solutions!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Verify Email Address
            </a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      })

      if (error) {
        console.error("Email send error:", error)
        return { success: false, error: "Failed to send verification email" }
      }

      return { success: true }
    } catch (error) {
      console.error("Send verification email error:", error)
      return { success: false, error: "Failed to send verification email" }
    }
  })
}

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenRecord = await db.oneTimeToken.findByToken(token, "VERIFY_EMAIL")

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired token" }
    }

    // Mark token as used
    await db.oneTimeToken.markUsed(tokenRecord.id)

    // Mark email as verified
    await db.user.update(tokenRecord.userId, {
      emailVerifiedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Verify email error:", error)
    return { success: false, error: "Email verification failed" }
  }
}

export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  return safeEmailOperation(async () => {
    try {
      const user = await db.user.findByEmail(email.toLowerCase())
      if (!user) {
        // Don't reveal if user exists
        return { success: true }
      }

      // Generate reset token
      const token = randomBytes(32).toString("hex")

      // Store token in database
      await db.oneTimeToken.create({
        userId: user.id,
        purpose: "RESET_PASSWORD",
        tokenHash: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`

      const { data, error } = await getResendClient().emails.send({
        from: "Crafted Surface Solutions <noreply@craftedsurfacesolutions.com>",
        to: [email],
        subject: "Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #166534;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <a href="${resetUrl}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })

      if (error) {
        console.error("Password reset email error:", error)
        return { success: false, error: "Failed to send reset email" }
      }

      return { success: true }
    } catch (error) {
      console.error("Send password reset email error:", error)
      return { success: false, error: "Failed to send reset email" }
    }
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenRecord = await db.oneTimeToken.findByToken(token, "RESET_PASSWORD")

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired token" }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await db.user.update(tokenRecord.userId, { passwordHash })

    // Mark token as used
    await db.oneTimeToken.markUsed(tokenRecord.id)

    // Revoke all existing sessions for security
    await db.session.revokeAllForUser(tokenRecord.userId)

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "Password reset failed" }
  }
}
