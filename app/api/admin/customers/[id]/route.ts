import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return { user, supabase }
  } catch (error) {
    console.error("[v0] Role lookup error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { supabase } = authResult
    const customerId = params.id

    const { data: customer, error: customerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", customerId)
      .single()

    if (customerError) {
      console.error("[v0] Customer fetch error:", customerError)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const [quotesResult, projectsResult, appointmentsResult] = await Promise.all([
      supabase.from("quotes").select("*").eq("customer_id", customerId),
      supabase.from("projects").select("*").eq("customer_id", customerId),
      supabase.from("appointments").select("*").eq("customer_id", customerId),
    ])

    return NextResponse.json({
      ...customer,
      quotes: quotesResult.data || [],
      projects: projectsResult.data || [],
      appointments: appointmentsResult.data || [],
    })
  } catch (error) {
    console.error("[v0] Customer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { supabase } = authResult
    const customerId = params.id
    const body = await request.json()

    const { data: updatedCustomer, error: updateError } = await supabase
      .from("users")
      .update({
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Customer update error:", updateError)
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
    }

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error("[v0] Customer update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
