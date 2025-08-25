import { type NextRequest, NextResponse } from "next/server"
import { requireCustomer } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomer()

    const supabase = await createClient()

    // Get quotes for leads submitted by this customer
    const { data: customerLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .eq("submitted_by_id", user.id)

    if (leadsError) {
      console.error("[v0] Error fetching customer leads:", leadsError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const leadIds = customerLeads?.map((lead) => lead.id) || []

    if (leadIds.length === 0) {
      return NextResponse.json([])
    }

    // Get quotes for these leads
    const { data: quotes, error: quotesError } = await supabase.from("quotes").select("*").in("lead_id", leadIds)

    if (quotesError) {
      console.error("[v0] Error fetching quotes:", quotesError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json(quotes || [])
  } catch (error) {
    console.error("[v0] Customer quotes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
