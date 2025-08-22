import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import CustomerLoginForm from "@/components/customer-login-form"

export default async function CustomerLoginPage() {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (user && !error) {
      // Check if user is a customer
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (userData?.role === "customer") {
        redirect("/customer-portal")
      } else if (userData?.role === "admin") {
        redirect("/admin-new")
      }
    }
  } catch (error) {
    console.log("Auth check failed during build:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 relative mx-auto mb-4">
            <img src="/css-logo.png" alt="Crafted Surface Solutions Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
          <p className="text-gray-400">Crafted Surface Solutions</p>
        </div>
        <CustomerLoginForm />
      </div>
    </div>
  )
}
