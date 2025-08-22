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

    // Check user role
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userProfile || !["admin", "ADMIN", "staff", "STAFF"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    let query = supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data: projects, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    console.error("Projects API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, customer_id, status, progress_percentage, square_footage, project_address } = body

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title: title || "New Project",
        customer_id: customer_id || null,
        status: status || "planning",
        progress_percentage: progress_percentage || 0,
        square_footage: square_footage || 0,
        project_address: project_address || "",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create project", details: error }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
