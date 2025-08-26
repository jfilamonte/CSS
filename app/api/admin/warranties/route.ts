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
    const { data: warranties, error } = await supabase
      .from("warranties")
      .select(`
        *,
        projects (
          id,
          name,
          customers (
            id,
            name,
            email
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ warranties })
  } catch (error) {
    console.error("[v0] Warranties GET error:", error)
    return NextResponse.json({ error: "Failed to fetch warranties" }, { status: 500 })
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

    const { data: warranty, error } = await supabase
      .from("warranties")
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

    return NextResponse.json({ warranty })
  } catch (error) {
    console.error("[v0] Warranties POST error:", error)
    return NextResponse.json({ error: "Failed to create warranty" }, { status: 500 })
  }
}
