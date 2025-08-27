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

    const monthlyData = []
    const currentDate = new Date()

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)

      const [{ count: monthQuotes }, { count: monthProjects }, { data: monthEstimates }] = await Promise.all([
        supabase
          .from("quotes")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase
          .from("estimates")
          .select("total_amount")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
      ])

      const monthRevenue = monthEstimates?.reduce((sum, est) => sum + (est.total_amount || 0), 0) || 0

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        quotes: monthQuotes || 0,
        projects: monthProjects || 0,
        revenue: monthRevenue,
      })
    }

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
