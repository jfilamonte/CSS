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

    // Get user profile to check admin role
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Query real error logs from database
    const { data: logs, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Database error fetching logs:", error)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    console.log("[v0] Error logs API returning real data:", logs?.length || 0, "logs")
    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("Error in error-logs GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const errorLog = await request.json()

    const { error } = await supabase.from("error_logs").insert([
      {
        error_message: errorLog.error_message,
        error_stack: errorLog.error_stack,
        error_type: errorLog.error_type || "Error",
        severity: errorLog.severity || "error",
        url: errorLog.url,
        user_agent: errorLog.user_agent,
        user_id: errorLog.user_id,
        session_id: errorLog.session_id,
        context: errorLog.context,
      },
    ])

    if (error) {
      console.error("Database error storing log:", error)
      return NextResponse.json({ error: "Failed to store log" }, { status: 500 })
    }

    console.log("[v0] Error log stored in database:", errorLog.error_message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in error-logs POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

    if (error) {
      console.error("Database error clearing logs:", error)
      return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
    }

    console.log("[v0] Error logs cleared from database")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
