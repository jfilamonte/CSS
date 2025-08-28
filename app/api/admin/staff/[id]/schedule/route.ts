import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Authentication required")
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("email", user.email)
    .single()

  if (userError || userData?.role !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, supabase }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Staff schedule API - GET request started")
    const { supabase } = await requireAdmin()

    const staffId = params.id

    // Check if staff_schedules table exists, if not return empty array
    const { data: schedules, error } = await supabase
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", staffId)
      .order("date", { ascending: false })

    if (error) {
      console.log("[v0] Staff schedules table not found, returning empty array")
      return NextResponse.json([])
    }

    console.log(`[v0] Staff schedule API - Success, found ${schedules?.length || 0} schedule entries`)
    return NextResponse.json(schedules || [])
  } catch (error) {
    console.error("[v0] Staff schedule API - Error:", error)
    return NextResponse.json({ error: "Failed to fetch staff schedules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Staff schedule API - POST request started")
    const { supabase } = await requireAdmin()

    const staffId = params.id
    const body = await request.json()

    const scheduleData = {
      staff_id: staffId,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      shift_type: body.shift_type || "regular",
      status: body.status || "scheduled",
      notes: body.notes || null,
      created_at: new Date().toISOString(),
    }

    // Try to insert into staff_schedules table
    const { data, error } = await supabase.from("staff_schedules").insert(scheduleData).select().single()

    if (error) {
      console.error("[v0] Staff schedule POST error:", error.message)
      return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 })
    }

    console.log("[v0] Staff schedule API - Schedule created successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Staff schedule API - Error:", error)
    return NextResponse.json({ error: "Failed to create schedule entry" }, { status: 500 })
  }
}
