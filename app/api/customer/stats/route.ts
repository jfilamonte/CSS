import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer's leads (quote requests)
    const leads = await db.lead.findMany({
      filters: { submittedById: user.id },
    })

    // Get customer's projects
    const projects = await db.project.findMany({
      filters: { customerId: user.id },
    })

    // Calculate stats
    const activeQuotes = leads.filter((lead) =>
      ["NEW", "CONTACTED", "ESTIMATE_SENT", "SCHEDULED"].includes(lead.status),
    ).length

    const activeProjects = projects.filter((project) => project.status === "IN_PROGRESS").length

    // Calculate total investment from all quotes/projects
    const totalInvestment = projects.reduce((sum, project) => sum + project.quote.totalCost.toNumber(), 0)

    const supabase = await createClient()

    const { count: upcomingAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user.id)
      .gte("scheduled_date", new Date().toISOString())
      .in("status", ["scheduled", "confirmed"])

    const stats = {
      activeQuotes,
      activeProjects,
      upcomingAppointments: upcomingAppointments || 0,
      totalInvestment,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Customer stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
