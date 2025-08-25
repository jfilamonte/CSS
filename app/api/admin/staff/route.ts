import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase" // Declared the createClient variable

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Staff API - GET request started")

    const user = await requireAdmin()

    const supabase = await createClient()

    const { data: staff, error: staffError } = await supabase
      .from("users")
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
