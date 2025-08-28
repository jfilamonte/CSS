import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const quoteId = params.id

    const { data: quote, error } = await supabase.from("quotes").select("*").eq("id", quoteId).single()

    if (error) {
      console.error("Get quote error:", error)
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error("Get quote error:", error)
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const quoteData = await request.json()
    const quoteId = params.id

    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email, // Fixed field name mapping
        customer_phone: quoteData.customer_phone, // Fixed field name mapping
        project_address: quoteData.project_address,
        square_footage: quoteData.square_footage,
        total_cost: quoteData.total_cost, // Fixed field name mapping
        status: quoteData.status,
        quote_data: quoteData.notes ? { notes: quoteData.notes } : {}, // Provide empty object instead of null
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId)
      .select()
      .single()

    if (error) {
      console.error("Update quote error:", error)
      return NextResponse.json({ error: "Failed to update quote" }, { status: 500 })
    }

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error("Update quote error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { status } = await request.json()
    const quoteId = params.id

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add timestamp fields based on status
    if (status === "SENT") updateData.sent_at = new Date().toISOString()
    if (status === "ACCEPTED") updateData.accepted_at = new Date().toISOString()
    if (status === "REJECTED") updateData.rejected_at = new Date().toISOString()

    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update(updateData)
      .eq("id", quoteId)
      .select()
      .single()

    if (error) {
      console.error("Update quote error:", error)
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error("Update quote error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
