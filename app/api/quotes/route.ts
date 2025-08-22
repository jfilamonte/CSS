import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, details } = body

    // Validate required fields
    if (!name || !phone || !email || !details) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Insert quote request into database
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          phone,
          email,
          project_details: details,
          status: "NEW",
          source: "website_quote_form",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save quote request" }, { status: 500 })
    }

    // Send notification email (optional)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quote_request",
          data: { name, phone, email, details },
        }),
      })
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        message: "Quote request submitted successfully",
        id: data[0]?.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Quote API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
