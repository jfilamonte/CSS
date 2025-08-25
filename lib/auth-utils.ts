import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer",
  SALES_REP: "sales_rep",
} as const

export interface User {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

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

export async function requireAuth(allowedRoles?: string[]): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
    redirect("/unauthorized")
  }

  return user
}

export async function requireAdminAuth(): Promise<User> {
  return requireAuth([ROLES.ADMIN])
}

export async function requireSalesRepAuth(): Promise<User> {
  return requireAuth([ROLES.SALES_REP, ROLES.ADMIN])
}

export async function requireCustomerAuth(): Promise<User> {
  return requireAuth([ROLES.CUSTOMER])
}

export function hasRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())
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

export async function signInAction(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

export async function signUpAction(
  email: string,
  password: string,
  userData: {
    first_name?: string
    last_name?: string
    phone?: string
    role?: string
  },
) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
