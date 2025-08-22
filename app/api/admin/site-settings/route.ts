import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Site settings API - GET request started")

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Site settings API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      console.log("[v0] Site settings API - Insufficient permissions")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings, error: dbError } = await supabase.from("site_settings").select("*")

    if (dbError) {
      console.error("[v0] Site settings API - Database error:", dbError)
      throw new Error(`Database query failed: ${dbError.message}`)
    }

    if (!settings) {
      console.error("[v0] Site settings API - No settings table found")
      throw new Error("Site settings table does not exist")
    }

    console.log("[v0] Site settings API - Success")
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[v0] Site settings API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Site settings API - PUT request started")

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Site settings API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      console.log("[v0] Site settings API - Admin access required")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()

    const { error: updateError } = await supabase.from("site_settings").upsert(settings)

    if (updateError) {
      console.error("[v0] Site settings API - Update error:", updateError)
      throw new Error(`Failed to update settings: ${updateError.message}`)
    }

    console.log("[v0] Site settings API - Settings updated:", settings.length, "items")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Site settings API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
