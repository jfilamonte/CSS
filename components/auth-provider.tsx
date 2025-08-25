"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { logError } from "@/lib/error-logger"

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isAdmin: boolean
  isStaff: boolean
  isCustomer: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [isCustomer, setIsCustomer] = useState(false)
  const [supabase] = useState(() => createClient())

  const updateUserRoles = useCallback((role: string | null) => {
    if (!role) {
      setIsAdmin(false)
      setIsStaff(false)
      setIsCustomer(false)
      return
    }

    const normalizedRole = role.toLowerCase()
    setIsAdmin(normalizedRole === "admin" || normalizedRole === "super_admin")
    setIsStaff(normalizedRole === "staff" || normalizedRole === "sales_person" || normalizedRole === "salesperson")
    setIsCustomer(normalizedRole === "customer")
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        await logError(error, { severity: "warn", context: { action: "session_refresh" } })
        console.warn("[v0] Session refresh failed:", error.message)
      } else {
        console.log("[v0] Session refreshed successfully")
      }
    } catch (error) {
      await logError(error as Error, { severity: "error", context: { action: "session_refresh" } })
    }
  }, [supabase])

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("id, email, role, first_name, last_name, phone, is_active")
          .eq("id", userId)
          .single()

        if (error) {
          await logError(error, { severity: "warn", context: { action: "fetch_user_profile", userId } })
          return null
        }

        setUserProfile(profile)
        updateUserRoles(profile?.role)
        return profile
      } catch (error) {
        await logError(error as Error, { severity: "error", context: { action: "fetch_user_profile", userId } })
        return null
      }
    },
    [supabase, updateUserRoles],
  )

  useEffect(() => {
    let sessionRefreshInterval: NodeJS.Timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          await logError(error, { severity: "warn", context: { action: "get_initial_session" } })
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)

          sessionRefreshInterval = setInterval(refreshSession, 50 * 60 * 1000)
        }
      } catch (error) {
        await logError(error as Error, { severity: "error", context: { action: "get_initial_session" } })
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email)

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)

        // Set up session refresh for new sessions
        if (event === "SIGNED_IN") {
          sessionRefreshInterval = setInterval(refreshSession, 50 * 60 * 1000)
        }
      } else {
        setUserProfile(null)
        updateUserRoles(null)

        // Clear session refresh on sign out
        if (sessionRefreshInterval) {
          clearInterval(sessionRefreshInterval)
        }
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval)
      }
    }
  }, [supabase, fetchUserProfile, refreshSession, updateUserRoles])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting sign in for:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Sign in error:", error.message)
        await logError(error, { severity: "warn", context: { action: "sign_in", email } })
      } else {
        console.log("[v0] Sign in successful")
      }

      return { error }
    } catch (error) {
      console.log("[v0] Sign in exception:", error)
      await logError(error as Error, { severity: "error", context: { action: "sign_in", email } })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("[v0] Signing out user")
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      await logError(error as Error, { severity: "error", context: { action: "sign_out" } })
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    refreshSession,
    isAdmin,
    isStaff,
    isCustomer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
