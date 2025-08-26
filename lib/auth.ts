import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface User {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("[v0] Getting current user...")
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.log("[v0] No authenticated user found")
      return null
    }

    console.log("[v0] Auth user found:", authUser.email)

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", authUser.email)
      .single()

    if (userError || !userData) {
      console.error("[v0] User data error:", userError)
      return null
    }

    console.log("[v0] User data found:", userData.email, "Role:", userData.role)
    return userData
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function signIn(email: string, password: string, ip?: string, userAgent?: string) {
  try {
    console.log("[v0] Attempting sign in for:", email)
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[v0] Auth sign in error:", error.message)
      return { success: false, error: error.message }
    }

    console.log("[v0] Auth sign in successful, getting user data...")

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", email)
      .single()

    if (userError || !userData) {
      console.error("[v0] User data error:", userError)
      return { success: false, error: "User data not found" }
    }

    console.log("[v0] Sign in complete - User:", userData.email, "Role:", userData.role)
    return { success: true, user: userData }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function registerUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: string
}) {
  try {
    console.log("[v0] Registering user:", userData.email)
    const supabase = await createClient() // Added await for server client

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role.toLowerCase(), // Normalize role to lowercase
        },
      },
    })

    if (error) {
      console.error("[v0] Registration error:", error.message)
      return { success: false, error: error.message }
    }

    console.log("[v0] Registration successful for:", userData.email)
    return { success: true, user: data.user }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const normalizedRole = user.role?.toLowerCase()
  if (!["admin", "super_admin"].includes(normalizedRole)) {
    redirect("/unauthorized")
  }

  return user
}

export async function verifySession(): Promise<User | null> {
  return getCurrentUser()
}

export async function verifyAuth(allowedRoles?: string[]): Promise<User | null> {
  const user = await getCurrentUser()

  if (!user) {
    console.log("[v0] No user found for auth verification")
    return null
  }

  if (allowedRoles) {
    const normalizedUserRole = normalizeRole(user.role)
    const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role))

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.log("[v0] User role", normalizedUserRole, "not in allowed roles:", normalizedAllowedRoles)
      return null
    }
  }

  console.log("[v0] Auth verification successful for:", user.email)
  return user
}

export async function refreshSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Refresh session error:", error)
    return { success: false, error: "Session refresh failed" }
  }
}

export function normalizeRole(role: string): string {
  const normalized = role.toLowerCase()

  // Handle role variations
  if (normalized === "sales_person" || normalized === "salesperson") {
    return "staff"
  }
  if (normalized === "super_admin") {
    return "admin"
  }

  return normalized
}
