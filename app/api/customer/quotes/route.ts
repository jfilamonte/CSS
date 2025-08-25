import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get quotes for leads submitted by this customer
    const customerLeads = await db.lead.findMany({
      filters: { submittedById: user.id },
    })

    const leadIds = customerLeads.map((lead) => lead.id)

    // Get quotes for these leads
    const quotes = await db.quote.findMany()
    const customerQuotes = quotes.filter((quote) => leadIds.includes(quote.leadId))

    return NextResponse.json(customerQuotes)
  } catch (error) {
    console.error("Customer quotes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
