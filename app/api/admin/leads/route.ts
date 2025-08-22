import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!userProfile || !["ADMIN", "STAFF", "admin", "staff"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")

    let query = supabase.from("quotes").select("*")

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    let transformedLeads = (quotes || []).map((quote) => ({
      id: quote.id,
      name: quote.customer_name,
      email: quote.customer_email,
      phone: quote.customer_phone,
      project_type: quote.package_id ? "Package Quote" : "Custom Quote",
      message: quote.project_address || "",
      status: quote.status || "new",
      created_at: quote.created_at,
    }))

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      transformedLeads = transformedLeads.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.project_type?.toLowerCase().includes(searchLower),
      )
    }

    return NextResponse.json({ leads: transformedLeads })
  } catch (error) {
    console.error("Leads API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!userProfile || !["ADMIN", "STAFF", "admin", "staff"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      customer_name,
      customer_email,
      customer_phone,
      project_address,
      square_footage,
      project_type,
      message,
      package_id,
      custom_components,
      total_cost,
    } = body

    const { data: newQuote, error } = await supabase
      .from("quotes")
      .insert([
        {
          customer_name: customer_name,
          customer_email: customer_email,
          customer_phone: customer_phone,
          project_address: project_address || message,
          square_footage: square_footage || 1000,
          package_id: package_id || null,
          custom_components: custom_components || {},
          total_cost: total_cost || 0,
          quote_data: {
            project_type: project_type || "General",
            message: message || "",
            created_by: "admin",
            source: "admin_portal",
          },
          status: "new",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
    }

    const transformedLead = {
      id: newQuote.id,
      name: newQuote.customer_name,
      email: newQuote.customer_email,
      phone: newQuote.customer_phone,
      project_type: project_type || "General",
      message: newQuote.project_address,
      status: newQuote.status,
      created_at: newQuote.created_at,
    }

    return NextResponse.json({ lead: transformedLead }, { status: 201 })
  } catch (error) {
    console.error("Create lead API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
