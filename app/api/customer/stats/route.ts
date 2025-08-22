import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

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

    const stats = {
      activeQuotes,
      activeProjects,
      upcomingAppointments: 0, // TODO: Implement appointments
      totalInvestment,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Customer stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
