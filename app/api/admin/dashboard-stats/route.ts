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

    const [
      { count: totalLeads },
      { count: activeQuotes },
      { count: ongoingProjects },
      { data: estimates },
      { count: newLeadsThisWeek },
      { count: quotesThisWeek },
      { count: projectsCompletedThisMonth },
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("quotes").select("*", { count: "exact", head: true }).in("status", ["pending", "sent", "approved"]),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase.from("estimates").select("total_amount"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("updated_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    const totalRevenue = estimates?.reduce((sum, est) => sum + (est.total_amount || 0), 0) || 0
    const conversionRate = totalLeads && activeQuotes ? Math.round((activeQuotes / totalLeads) * 100) : 0

    const stats = {
      totalLeads: totalLeads || 0,
      activeQuotes: activeQuotes || 0,
      ongoingProjects: ongoingProjects || 0,
      totalRevenue,
      newLeadsThisWeek: newLeadsThisWeek || 0,
      quotesThisWeek: quotesThisWeek || 0,
      projectsCompletedThisMonth: projectsCompletedThisMonth || 0,
      conversionRate,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
