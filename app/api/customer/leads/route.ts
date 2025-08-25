import { type NextRequest, NextResponse } from "next/server"
import { requireCustomer } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomer()

    const supabase = await createClient()

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("submitted_by_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json(leads || [])
  } catch (error) {
    console.error("[v0] Customer leads error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer()

    const leadData = await request.json()
    const supabase = await createClient()

    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        full_name: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        project_type: leadData.projectType,
        square_footage: leadData.squareFootage,
        timeline: leadData.timeline,
        address: leadData.address,
        city: leadData.city,
        state: leadData.state,
        zip_code: leadData.zipCode,
        details: leadData.details,
        wants_appointment: leadData.wantsAppointment,
        submitted_by_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    return NextResponse.json(newLead)
  } catch (error) {
    console.error("[v0] Create lead error:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
