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

    const { data: services, error } = await supabase
      .from("service_packages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    return NextResponse.json({ services: services || [] })
  } catch (error) {
    console.error("Services API error:", error)
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

    const body = await request.json()
    const { name, description, package_type, base_price_per_sqft, is_active } = body

    const { data: newService, error } = await supabase
      .from("service_packages")
      .insert([
        {
          name,
          description,
          package_type,
          base_price_per_sqft,
          is_active: is_active ?? true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
    }

    return NextResponse.json({ service: newService }, { status: 201 })
  } catch (error) {
    console.error("Create service API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
