import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CustomerDashboard from "@/components/customer-dashboard"

export const dynamic = "force-dynamic"

export default async function CustomerPortalPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user has customer role
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", data.user.id).single()

  if (!userProfile || userProfile.role !== "CUSTOMER") {
    redirect("/")
  }

  return <CustomerDashboard />
}
