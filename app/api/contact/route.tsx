import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

function getResendClient() {
  if (typeof window !== "undefined") {
    return null
  }

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY_CSS) {
    console.warn("RESEND_API_KEY_CSS not found in development")
    return null
  }

  if (!process.env.RESEND_API_KEY_CSS) {
    return null
  }

  return new Resend(process.env.RESEND_API_KEY_CSS)
}

export async function POST(request: NextRequest) {
  try {
    const resend = getResendClient()

    if (!resend) {
      console.error("Resend client not available")
      return NextResponse.json({ error: "Email service not available" }, { status: 500 })
    }

    const formData = await request.formData()

    const contactData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    // Validate required fields
    if (!contactData.firstName || !contactData.lastName || !contactData.email || !contactData.message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Send notification email to business
    await resend.emails.send({
      from: "Contact Form <noreply@craftedsurfacesolutions.com>",
      to: ["sales@craftedsurfacesolutions.com"],
      subject: `New Contact Form Submission: ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2b725e;">New Contact Form Submission</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2b725e;">Contact Information</h3>
            <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Phone:</strong> ${contactData.phone || "Not provided"}</p>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #2b725e;">Message</h3>
            <p style="white-space: pre-wrap;">${contactData.message}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #2b725e;">
              <strong>Next Steps:</strong> Please respond to this inquiry within 24 hours for the best customer experience.
            </p>
          </div>
        </div>
      `,
    })

    // Send confirmation email to customer
    await resend.emails.send({
      from: "Crafted Surface Solutions <noreply@craftedsurfacesolutions.com>",
      to: [contactData.email],
      subject: "Thank you for contacting Crafted Surface Solutions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2b725e;">Thank You for Your Message!</h2>
          
          <p>Hi ${contactData.firstName},</p>
          
          <p>Thank you for contacting Crafted Surface Solutions. We've received your message and will get back to you within 24 hours.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2b725e;">Your Message Summary</h3>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px;">${contactData.message}</p>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2b725e;">Need Immediate Assistance?</h3>
            <p style="margin-bottom: 10px;">Call us directly at: <strong>(413) 497-2100</strong></p>
            <p style="margin: 0;">Email: <strong>sales@craftedsurfacesolutions.com</strong></p>
          </div>

          <p>Best regards,<br>
          The Crafted Surface Solutions Team</p>
        </div>
      `,
    })

    return NextResponse.redirect(new URL("/contact/thank-you", request.url))
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
