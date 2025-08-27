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
    return { error: "Unauthorized", status: 401 }
  }

  const { data: userRecord } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userRecord || userRecord.role !== "admin") {
    console.error("[v0] No admin user found for user:", user.id)
    return { error: "Unauthorized", status: 401 }
  }

  return { ...user, role: userRecord.role, supabase }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - GET request started")
    const adminResult = await requireAdmin(request)

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult

    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("[v0] Appointments API - Database error:", dbError)
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
    }

    console.log("[v0] Appointments API - Success, found", appointments?.length || 0, "appointments")
    return NextResponse.json(appointments || [])
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - POST request started")
    const adminResult = await requireAdmin(request)

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult
    const data = await request.json()

    const { error: insertError } = await supabase.from("appointments").insert([data])

    if (insertError) {
      console.error("[v0] Appointments API - Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
    }

    console.log("[v0] Appointments API - Appointment created:", data.title)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
