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

    // Check if user has admin role
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!userProfile || !["ADMIN", "STAFF", "admin", "staff"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    let query = supabase.from("quotes").select("*")

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json(quotes || [])
  } catch (error) {
    console.error("Quotes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
