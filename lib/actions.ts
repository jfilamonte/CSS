"use server"
import { redirect } from "next/navigation"
import { signIn as authSignIn, signOut as authSignOut, registerUser } from "@/lib/auth"
import { headers } from "next/headers"

async function getClientInfo() {
  const headersList = headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"
  return { ip, userAgent }
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  const result = await authSignIn(email, password, ip, userAgent)

  if (!result.success) {
    console.error("[v0] Sign in error:", result.error)
    return { error: result.error || "Authentication failed" }
  }

  if (result.user) {
    console.log("[v0] Sign in successful for:", result.user.email, "Role:", result.user.role)

    const normalizedRole = result.user.role.toLowerCase()

    if (normalizedRole === "admin") {
      redirect("/admin-new")
    } else if (normalizedRole === "staff") {
      redirect("/sales-dashboard")
    } else {
      redirect("/customer-portal")
    }
  }

  return { error: "Authentication failed" }
}

export async function signInCustomer(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  const result = await authSignIn(email, password, ip, userAgent)

  if (!result.success) {
    return { error: result.error || "Authentication failed" }
  }

  if (result.user && result.user.role.toLowerCase() === "customer") {
    redirect("/customer-portal")
  } else {
    return { error: "Invalid customer credentials" }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  return { error: "Customer registration is being updated. Please contact support." }
}

export async function registerCustomer(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const phone = formData.get("phone") as string

  if (!email || !password || !firstName || !lastName) {
    return { error: "All required fields must be filled" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" }
  }

  const result = await registerUser({
    email,
    password,
    firstName,
    lastName,
    phone,
    role: "CUSTOMER",
  })

  if (!result.success) {
    return { error: result.error || "Registration failed" }
  }

  // Auto sign in after registration
  const { ip, userAgent } = await getClientInfo()
  const signInResult = await authSignIn(email, password, ip, userAgent)

  if (signInResult.success) {
    redirect("/customer-portal")
  }

  return { success: true, message: "Registration successful! Please sign in." }
}

export async function loginSalesRep(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  const result = await authSignIn(email, password, ip, userAgent)

  if (!result.success) {
    return { error: result.error || "Authentication failed" }
  }

  const normalizedRole = result.user.role.toLowerCase()
  if (result.user && (normalizedRole === "staff" || normalizedRole === "admin")) {
    redirect("/sales-dashboard")
  } else {
    return { error: "Invalid staff credentials" }
  }
}

export async function blockSalesRepTime(formData: FormData) {
  console.log("[v0] Block time feature coming soon")
  return { error: "Scheduling system is being updated. Please check back soon." }
}

export async function requestTimeOff(formData: FormData) {
  console.log("[v0] Time off requests feature coming soon")
  return { error: "Time off system is being updated. Please check back soon." }
}

export async function signOut() {
  await authSignOut()
  redirect("/")
}
