import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Staff API - GET request started")

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Staff API - Authentication failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      console.log("[v0] Staff API - Insufficient permissions")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all staff members from profiles table
    const { data: staff, error: staffError } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "staff"])
      .order("created_at", { ascending: false })

    if (staffError) {
      console.error("[v0] Staff API - Database error:", staffError)
      throw new Error(`Failed to fetch staff: ${staffError.message}`)
    }

    if (!staff) {
      console.error("[v0] Staff API - No staff data returned")
      throw new Error("Staff data not found")
    }

    console.log("[v0] Staff API - Success, found", staff.length, "staff members")
    return NextResponse.json(staff)
  } catch (error) {
    console.error("[v0] Staff API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
