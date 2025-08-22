import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

async function requireAdmin(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized")
  }

  return { ...user, role: profile.role, supabase }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - GET request started")
    const { supabase } = await requireAdmin(request)

    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("[v0] Appointments API - Database error:", dbError)
      throw new Error(`Failed to fetch appointments: ${dbError.message}`)
    }

    if (!appointments) {
      console.error("[v0] Appointments API - No appointments table found")
      throw new Error("Appointments table does not exist")
    }

    console.log("[v0] Appointments API - Success, found", appointments.length, "appointments")
    return NextResponse.json(appointments)
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - POST request started")
    const { supabase } = await requireAdmin(request)
    const data = await request.json()

    const { error: insertError } = await supabase.from("appointments").insert([data])

    if (insertError) {
      console.error("[v0] Appointments API - Insert error:", insertError)
      throw new Error(`Failed to create appointment: ${insertError.message}`)
    }

    console.log("[v0] Appointments API - Appointment created:", data.title)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
