"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("[v0] Getting initial session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[v0] Initial session:", session?.user?.email || "No user")
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log("[v0] Checking user role for:", session.user.email)
          const { data: profile, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()

          if (error) {
            console.log("[v0] Error fetching user role:", error.message)
          } else {
            console.log("[v0] User role:", profile?.role)
            const role = profile?.role?.toLowerCase()
            setIsAdmin(role === "admin" || role === "super_admin")
          }
        }
      } catch (error) {
        console.error("[v0] Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email || "No user")
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        // Use setTimeout to avoid blocking the auth state change
        setTimeout(async () => {
          try {
            const { data: profile, error } = await supabase
              .from("users")
              .select("role")
              .eq("id", session.user.id)
              .single()

            if (error) {
              console.log("[v0] Error fetching user role:", error.message)
              setIsAdmin(false)
            } else {
              console.log("[v0] User role:", profile?.role)
              const role = profile?.role?.toLowerCase()
              setIsAdmin(role === "admin" || role === "super_admin")
            }
          } catch (error) {
            console.error("[v0] Error checking user role:", error)
            setIsAdmin(false)
          }
        }, 0)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    try {
      console.log("[v0] Attempting sign in for:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin-new`,
        },
      })

      if (error) {
        console.log("[v0] Sign in error:", error.message)
      } else {
        console.log("[v0] Sign in successful")
      }

      return { error }
    } catch (error) {
      console.log("[v0] Sign in exception:", error)
      return { error }
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    try {
      console.log("[v0] Signing out user")
      await supabase.auth.signOut()
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
