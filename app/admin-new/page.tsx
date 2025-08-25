"use client"

import { useState, useEffect } from "react"
import { AdminDashboardNew } from "@/components/admin-dashboard-new"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[v0] Checking authentication...")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/auth/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError || (userData?.role !== "admin" && userData?.role !== "ADMIN")) {
          console.log("[v0] User is not admin, redirecting")
          router.push("/auth/login")
          return
        }

        setIsAuthenticated(true)
        console.log("[v0] Authentication successful")
      } catch (error) {
        console.error("[v0] Authentication error:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin portal...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  return <AdminDashboardNew />
}
