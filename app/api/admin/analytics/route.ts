import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get total quotes
    const { count: totalQuotes } = await supabase.from("quotes").select("*", { count: "exact", head: true })

    // Get total projects
    const { count: totalProjects } = await supabase.from("projects").select("*", { count: "exact", head: true })

    // Get total revenue from estimates
    const { data: estimates } = await supabase.from("estimates").select("total_amount")

    const totalRevenue = estimates?.reduce((sum, est) => sum + (est.total_amount || 0), 0) || 0

    // Calculate conversion rate
    const conversionRate = totalQuotes && totalProjects ? Math.round((totalProjects / totalQuotes) * 100) : 0

    // Get monthly data (simplified)
    const monthlyData = [
      { month: "Jan", quotes: 12, projects: 8, revenue: 45000 },
      { month: "Feb", quotes: 15, projects: 10, revenue: 52000 },
      { month: "Mar", quotes: 18, projects: 12, revenue: 68000 },
      { month: "Apr", quotes: 22, projects: 15, revenue: 75000 },
      { month: "May", quotes: 25, projects: 18, revenue: 82000 },
      { month: "Jun", quotes: 20, projects: 14, revenue: 71000 },
    ]

    // Get status breakdown
    const { data: quoteStatuses } = await supabase.from("quotes").select("status")

    const statusCounts =
      quoteStatuses?.reduce((acc: any, quote) => {
        const status = quote.status || "new"
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {}) || {}

    const statusBreakdown = Object.entries(statusCounts).map(([name, value], index) => ({
      name,
      value: value as number,
      color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"][index % 5],
    }))

    const analytics = {
      totalQuotes: totalQuotes || 0,
      totalProjects: totalProjects || 0,
      totalRevenue,
      conversionRate,
      monthlyData,
      statusBreakdown,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
