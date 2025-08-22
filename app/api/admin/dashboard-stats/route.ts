import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const stats = {
      totalLeads: 24,
      activeQuotes: 8,
      ongoingProjects: 5,
      totalRevenue: 125000,
      newLeadsThisWeek: 6,
      quotesThisWeek: 3,
      projectsCompletedThisMonth: 4,
      conversionRate: 35,
    }

    console.log("[v0] Dashboard stats API returning mock data:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
