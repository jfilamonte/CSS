import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: subcontractors, error } = await supabase
      .from("subcontractors")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ subcontractors })
  } catch (error) {
    console.error("[v0] Subcontractors GET error:", error)
    return NextResponse.json({ error: "Failed to fetch subcontractors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const { data: subcontractor, error } = await supabase
      .from("subcontractors")
      .insert([
        {
          ...body,
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subcontractor })
  } catch (error) {
    console.error("[v0] Subcontractors POST error:", error)
    return NextResponse.json({ error: "Failed to create subcontractor" }, { status: 500 })
  }
}
