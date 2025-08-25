"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import SalesRepLoginForm from "@/components/sales-rep-login-form"

export default function SalesLoginPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check if user is a sales rep
          const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

          const normalizedRole = userData?.role?.toLowerCase()

          if (normalizedRole === "staff") {
            router.push("/sales-dashboard")
            return
          } else if (normalizedRole === "customer") {
            router.push("/customer-portal")
            return
          } else if (normalizedRole === "admin") {
            router.push("/admin-new")
            return
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 relative mx-auto mb-4">
            <img src="/css-logo.png" alt="Crafted Surface Solutions Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sales Portal</h1>
          <p className="text-gray-400">Crafted Surface Solutions</p>
        </div>
        <SalesRepLoginForm />
      </div>
    </div>
  )
}
