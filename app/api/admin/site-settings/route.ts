import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Site settings API - GET request started")

    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    // Get user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Site settings API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRecord, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      console.error("[v0] Site settings API - Role lookup error:", roleError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!userRecord || !["admin", "staff"].includes(userRecord.role)) {
      console.log("[v0] Site settings API - Insufficient permissions")
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: settings, error: dbError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("setting_category", "site")

    if (dbError) {
      console.error("[v0] Site settings API - Database error:", dbError.message)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    console.log("[v0] Site settings API - Success")
    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error("[v0] Site settings API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Site settings API - PUT request started")

    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    // Get user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Site settings API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userRecord, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      console.error("[v0] Site settings API - Role lookup error:", roleError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!userRecord || userRecord.role !== "admin") {
      console.log("[v0] Site settings API - Admin access required")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: "Settings data required" }, { status: 400 })
    }

    const settingsArray = Array.isArray(settings) ? settings : [settings]
    const settingsToUpsert = settingsArray.map((setting) => ({
      ...setting,
      setting_category: "site",
      updated_at: new Date().toISOString(),
    }))

    const { error: updateError } = await supabase.from("business_settings").upsert(settingsToUpsert)

    if (updateError) {
      console.error("[v0] Site settings API - Update error:", updateError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    console.log("[v0] Site settings API - Settings updated:", Array.isArray(settings) ? settings.length : 1, "items")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Site settings API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
