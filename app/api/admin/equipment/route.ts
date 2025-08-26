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
    const { data: equipment, error } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error("[v0] Equipment GET error:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
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

    const { data: equipment, error } = await supabase
      .from("equipment")
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

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error("[v0] Equipment POST error:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}
