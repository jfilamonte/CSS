import { type NextRequest, NextResponse } from "next/server"
import { requireCustomer } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomer()

    const supabase = await createClient()

    // Get customer's quotes
    const { data: quotes } = await supabase.from("quotes").select("*").eq("customer_email", user.email)

    // Get customer's projects
    const { data: projects } = await supabase.from("projects").select("*").eq("customer_id", user.id)

    // Calculate stats
    const activeQuotes = quotes?.filter((quote) => ["pending", "approved"].includes(quote.status)).length || 0

    const activeProjects = projects?.filter((project) => project.status === "in_progress").length || 0

    // Calculate total investment from all projects
    const totalInvestment = projects?.reduce((sum, project) => sum + (project.total_cost || 0), 0) || 0

    const stats = {
      activeQuotes,
      activeProjects,
      upcomingAppointments: 0, // TODO: Implement appointments
      totalInvestment,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Customer stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
