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
  console.log("[v0] Starting signIn process")
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[v0] Email:", email)
  console.log("[v0] Password length:", password?.length)

  if (!email || !password) {
    console.log("[v0] Missing email or password")
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  console.log("[v0] Client info - IP:", ip, "UserAgent:", userAgent?.substring(0, 50))

  const result = await authSignIn(email, password, ip, userAgent)
  console.log("[v0] Auth result:", JSON.stringify(result, null, 2))

  if (!result.success) {
    console.error("[v0] Sign in error:", result.error)
    return { error: result.error || "Authentication failed" }
  }

  if (result.user) {
    console.log("[v0] Sign in successful for:", result.user.email, "Role:", result.user.role)

    const userRole = result.user.role?.toLowerCase()
    console.log("[v0] Normalized role:", userRole)

    if (userRole === "admin" || userRole === "super_admin") {
      console.log("[v0] Redirecting admin to /admin-new")
      redirect("/admin-new")
    } else if (userRole === "staff" || userRole === "sales_person" || userRole === "salesperson") {
      console.log("[v0] Redirecting staff to /sales-dashboard")
      redirect("/sales-dashboard")
    } else if (userRole === "customer") {
      console.log("[v0] Redirecting customer to /customer-portal")
      redirect("/customer-portal")
    } else {
      console.log("[v0] Unknown role:", userRole, "redirecting to home")
      redirect("/")
    }
  }

  console.log("[v0] No user found in result, authentication failed")
  return { error: "Authentication failed" }
}

export async function signInCustomer(prevState: any, formData: FormData) {
  console.log("[v0] Starting signInCustomer process")
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    console.log("[v0] Customer login: Missing email or password")
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  const result = await authSignIn(email, password, ip, userAgent)
  console.log("[v0] Customer auth result:", JSON.stringify(result, null, 2))

  if (!result.success) {
    console.log("[v0] Customer login failed:", result.error)
    return { error: result.error || "Authentication failed" }
  }

  if (result.user && result.user.role?.toLowerCase() === "customer") {
    console.log("[v0] Customer login successful, redirecting")
    redirect("/customer-portal")
  } else {
    console.log("[v0] Invalid customer role:", result.user?.role)
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
  console.log("[v0] Starting loginSalesRep process")
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    console.log("[v0] Sales login: Missing email or password")
    return { error: "Email and password are required" }
  }

  const { ip, userAgent } = await getClientInfo()
  const result = await authSignIn(email, password, ip, userAgent)
  console.log("[v0] Sales auth result:", JSON.stringify(result, null, 2))

  if (!result.success) {
    console.log("[v0] Sales login failed:", result.error)
    return { error: result.error || "Authentication failed" }
  }

  const userRole = result.user?.role?.toLowerCase()
  if (
    result.user &&
    (userRole === "staff" ||
      userRole === "admin" ||
      userRole === "super_admin" ||
      userRole === "sales_person" ||
      userRole === "salesperson")
  ) {
    console.log("[v0] Sales login successful for role:", userRole)
    redirect("/sales-dashboard")
  } else {
    console.log("[v0] Invalid staff role:", result.user?.role)
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
