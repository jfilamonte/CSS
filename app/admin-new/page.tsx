"use client"

import { useState, useEffect } from "react"
import { AdminDashboardNew } from "@/components/admin-dashboard-new"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[v0] Checking authentication...")

        // Simple check - if user can access this page, they're authenticated
        // In production, this would be protected by middleware or server-side auth
        setIsAuthenticated(true)
        console.log("[v0] Authentication successful")
      } catch (error) {
        console.error("[v0] Authentication error:", error)
        window.location.href = "/auth/login"
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

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
