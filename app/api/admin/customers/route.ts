import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin, ROLES } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { data: customers, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", ROLES.CUSTOMER)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json(customers || [])
  } catch (error) {
    console.error("[v0] Customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
