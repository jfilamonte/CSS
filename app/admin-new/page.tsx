"use client"

import { useState, useEffect } from "react"
import { AdminDashboardNew } from "@/components/admin-dashboard-new"
import { requireAdmin } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[v0] Checking admin authentication...")

        const user = await requireAdmin()

        if (user) {
          setIsAuthenticated(true)
          console.log("[v0] Admin authentication successful")
        }
      } catch (error) {
        console.error("[v0] Admin authentication failed:", error)
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
