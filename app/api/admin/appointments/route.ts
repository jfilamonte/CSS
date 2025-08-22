import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin(request: NextRequest) {
  const supabase = await createClient()

  console.log("[v0] Supabase client created successfully")

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] Auth error or no user:", authError?.message || "No user")
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    console.error("[v0] No admin profile found for user:", user.id)
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
      throw new Error(`Database error accessing appointments table: ${dbError.message}`)
    }

    console.log("[v0] Appointments API - Success, found", appointments?.length || 0, "appointments")
    return NextResponse.json(appointments || [])
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch appointments" },
      { status: 500 },
    )
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create appointment" },
      { status: 500 },
    )
  }
}
