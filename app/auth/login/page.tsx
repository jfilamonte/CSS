"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting login process for:", email)
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin-new`,
        },
      })

      if (authError) {
        console.log("[v0] Authentication error:", authError.message)
        setError(authError.message)
        return
      }

      if (data.user) {
        console.log("[v0] User authenticated, fetching profile...")
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          console.error("[v0] Error fetching user profile:", profileError)
          setError("Failed to load user profile")
          return
        }

        const userRole = userProfile?.role?.toLowerCase() || "customer"
        console.log("[v0] User role:", userRole)

        if (userRole === "admin" || userRole === "super_admin") {
          console.log("[v0] Redirecting to admin portal")
          router.push("/admin-new")
        } else if (userRole === "staff" || userRole === "sales_person" || userRole === "salesperson") {
          console.log("[v0] Redirecting to sales dashboard")
          router.push("/sales-dashboard")
        } else {
          console.log("[v0] Redirecting to customer portal")
          router.push("/customer-portal")
        }
      }
    } catch (error: unknown) {
      console.error("[v0] Login exception:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">CSS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400">Crafted Surface Solutions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email and password to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-green-900 hover:bg-green-800" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
