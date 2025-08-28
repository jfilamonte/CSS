"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  userRole: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  const roleLoadedRef = useRef<string | null>(null)
  const authInitializedRef = useRef(false)
  const roleUpdateInProgressRef = useRef(false)

  const updateUserRole = useCallback(async (email: string) => {
    if (roleLoadedRef.current === email || roleUpdateInProgressRef.current) {
      console.log("[v0] Skipping role update - already loaded for:", email)
      return
    }

    roleUpdateInProgressRef.current = true

    try {
      console.log("[v0] Updating user role for:", email)
      const { data: profile } = await supabase.from("users").select("role").eq("email", email).single()

      if (profile) {
        const normalizedRole = profile.role?.toLowerCase()
        setUserRole(profile.role)
        setIsAdmin(normalizedRole === "admin" || normalizedRole === "super_admin")
        roleLoadedRef.current = email
        console.log("[v0] User role updated:", profile.role)
      }
    } catch (error) {
      console.error("[v0] Error updating user role:", error)
    } finally {
      roleUpdateInProgressRef.current = false
    }
  }, [])

  useEffect(() => {
    if (authInitializedRef.current) return

    const initializeAuth = async () => {
      try {
        console.log("[v0] Getting initial session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[v0] Initial session:", session?.user?.email || "none")
        setUser(session?.user ?? null)

        if (session?.user) {
          await updateUserRole(session.user.email!)
        }
      } catch (error) {
        console.error("[v0] Error getting initial session:", error)
      } finally {
        setLoading(false)
        authInitializedRef.current = true
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAdmin(false)
        setUserRole(null)
        roleLoadedRef.current = null
        setLoading(false)
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        if (roleLoadedRef.current !== session.user.email && !roleUpdateInProgressRef.current) {
          await updateUserRole(session.user.email!)
        } else {
          console.log("[v0] Role already loaded for user, skipping update")
        }
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[v0] Token refreshed, no role update needed")
        setLoading(false)
      } else if (event === "INITIAL_SESSION") {
        console.log("[v0] Initial session event, no action needed")
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      authInitializedRef.current = false
      roleLoadedRef.current = null
      roleUpdateInProgressRef.current = false
    }
  }, []) // Removed updateUserRole from dependencies to prevent auth listener re-registration

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[v0] AuthProvider sign in for:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] AuthProvider sign in error:", error.message)
      } else {
        console.log("[v0] AuthProvider sign in successful")
      }

      return { error }
    } catch (error) {
      console.log("[v0] AuthProvider sign in exception:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("[v0] AuthProvider signing out user")
      await supabase.auth.signOut()
      setUser(null)
      setIsAdmin(false)
      setUserRole(null)
      roleLoadedRef.current = null
    } catch (error) {
      console.error("[v0] Error signing out:", error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin,
    userRole,
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
