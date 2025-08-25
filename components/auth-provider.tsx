"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { ROLES, type UserRole } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  userProfile: { role: UserRole; first_name?: string; last_name?: string } | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isSalesRep: boolean
  isCustomer: boolean
  isStaff: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<{ role: UserRole; first_name?: string; last_name?: string } | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  const isAdmin = userProfile?.role === ROLES.ADMIN
  const isSalesRep = userProfile?.role === ROLES.SALES_REP
  const isCustomer = userProfile?.role === ROLES.CUSTOMER
  const isStaff = userProfile?.role === ROLES.STAFF

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("role, first_name, last_name")
            .eq("id", session.user.id)
            .single()

          setUserProfile(profile)
        }
      } catch (error) {
        console.error("[v0] Error getting initial session:", error)
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
        const { data: profile } = await supabase
          .from("users")
          .select("role, first_name, last_name")
          .eq("id", session.user.id)
          .single()

        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting sign in for:", email)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
    try {
      console.log("[v0] Signing out user")
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error("[v0] Error signing out:", error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    isAdmin,
    isSalesRep,
    isCustomer,
    isStaff,
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
