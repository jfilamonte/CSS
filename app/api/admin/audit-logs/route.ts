import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "super_admin"].includes(profile.role?.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get("resource_type")
    const resourceId = searchParams.get("resource_id")
    const action = searchParams.get("action")
    const userFilter = searchParams.get("user")
    const dateRange = searchParams.get("date_range") || "7d"

    let query = supabase.from("audit_logs").select(`
        *,
        users:user_id (
          email,
          full_name
        )
      `)

    // Apply filters
    if (resourceType) query = query.eq("resource_type", resourceType)
    if (resourceId) query = query.eq("resource_id", resourceId)
    if (action) query = query.eq("action", action)

    // Date range filter
    const now = new Date()
    const daysAgo = Number.parseInt(dateRange.replace("d", ""))
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    query = query.gte("timestamp", startDate.toISOString())

    // User filter (search in email or full_name)
    if (userFilter) {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .or(`email.ilike.%${userFilter}%,full_name.ilike.%${userFilter}%`)

      if (users && users.length > 0) {
        const userIds = users.map((u) => u.id)
        query = query.in("user_id", userIds)
      }
    }

    const { data: logs, error } = await query.order("timestamp", { ascending: false }).limit(100)

    if (error) {
      console.error("[v0] Failed to fetch audit logs:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[v0] Audit logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
