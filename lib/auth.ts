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
    const supabase = createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // Get user details from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", authUser.email)
      .single()

    if (userError || !userData) {
      return null
    }

    return userData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function signIn(email: string, password: string, ip?: string, userAgent?: string) {
  try {
    console.log("[v0] Auth signIn starting for email:", email)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("[v0] Supabase auth response:", {
      success: !error,
      error: error?.message,
      userId: data?.user?.id,
    })

    if (error) {
      console.log("[v0] Supabase auth error:", error.message)
      return { success: false, error: error.message }
    }

    // Get user role from users table
    console.log("[v0] Fetching user data from users table")
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", email)
      .single()

    console.log("[v0] User data query result:", {
      success: !userError,
      error: userError?.message,
      userData: userData ? { ...userData, role: userData.role } : null,
    })

    if (userError || !userData) {
      console.log("[v0] User data not found:", userError?.message)
      return { success: false, error: "User data not found" }
    }

    console.log("[v0] Authentication successful for:", userData.email, "with role:", userData.role)
    return { success: true, user: userData }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function signOut() {
  const supabase = createClient()
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
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!["admin", "super_admin"].includes(user.role)) {
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
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return user
}

export async function refreshSession(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
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
