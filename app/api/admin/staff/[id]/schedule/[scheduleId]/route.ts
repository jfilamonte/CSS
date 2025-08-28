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

export async function PUT(request: NextRequest, { params }: { params: { id: string; scheduleId: string } }) {
  try {
    console.log("[v0] Staff schedule API - PUT request started")
    const { supabase } = await requireAdmin()

    const { scheduleId } = params
    const body = await request.json()

    const updateData = {
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      shift_type: body.shift_type,
      status: body.status,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("staff_schedules")
      .update(updateData)
      .eq("id", scheduleId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Staff schedule PUT error:", error.message)
      return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 })
    }

    console.log("[v0] Staff schedule API - Schedule updated successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Staff schedule API - Error:", error)
    return NextResponse.json({ error: "Failed to update schedule entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; scheduleId: string } }) {
  try {
    console.log("[v0] Staff schedule API - DELETE request started")
    const { supabase } = await requireAdmin()

    const { scheduleId } = params

    const { error } = await supabase.from("staff_schedules").delete().eq("id", scheduleId)

    if (error) {
      console.error("[v0] Staff schedule DELETE error:", error.message)
      return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 })
    }

    console.log("[v0] Staff schedule API - Schedule deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Staff schedule API - Error:", error)
    return NextResponse.json({ error: "Failed to delete schedule entry" }, { status: 500 })
  }
}
