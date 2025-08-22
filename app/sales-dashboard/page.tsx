import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import SalesRepDashboard from "@/components/sales-rep-dashboard"

export const dynamic = "force-dynamic"

export default async function SalesDashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sales-portal")
  }

  // Check if user is a sales rep
  const { data: userData } = await supabase
    .from("users")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!userData || userData.role !== "sales_person") {
    redirect("/sales-portal")
  }

  return <SalesRepDashboard user={userData} />
}
