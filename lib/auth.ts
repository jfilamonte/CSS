import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface User {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  phone?: string
  is_active?: boolean
}

export const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  SALES_REP: "sales_rep",
  STAFF: "staff",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
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
      .select("id, email, role, first_name, last_name, phone, is_active")
      .eq("id", authUser.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return userData
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function verifyAuth(allowedRoles?: UserRole[]): Promise<User | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return null
  }

  return user
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    redirect("/unauthorized")
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  return requireAuth([ROLES.ADMIN])
}

export async function requireSalesRep(): Promise<User> {
  return requireAuth([ROLES.SALES_REP, ROLES.ADMIN])
}

export async function requireCustomer(): Promise<User> {
  return requireAuth([ROLES.CUSTOMER])
}

export async function requireStaff(): Promise<User> {
  return requireAuth([ROLES.STAFF, ROLES.ADMIN])
}

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role as UserRole)
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, [ROLES.ADMIN])
}

export function isSalesRep(user: User | null): boolean {
  return hasRole(user, [ROLES.SALES_REP])
}

export function isCustomer(user: User | null): boolean {
  return hasRole(user, [ROLES.CUSTOMER])
}

export function isStaff(user: User | null): boolean {
  return hasRole(user, [ROLES.STAFF])
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function signUp(userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  role: UserRole
}) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
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
    console.error("[v0] Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("[v0] Sign out error:", error)
  }
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
    console.error("[v0] Refresh session error:", error)
    return { success: false, error: "Session refresh failed" }
  }
}
