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
      console.log("[v0] Auth error or no user:", authError, user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching profile for user ID:", user.id)
    const { data: customerData, error: dbError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (dbError) {
      console.log("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Database error", details: dbError.message }, { status: 500 })
    }

    if (!customerData) {
      console.log("[v0] No customer data found for user:", user.id)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    console.log("[v0] Successfully fetched profile:", customerData)
    return NextResponse.json(customerData)
  } catch (error) {
    console.error("Customer profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    const { data: updatedCustomer, error: updateError } = await supabase
      .from("users")
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        zip_code: updates.zipCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error("Update customer profile error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
