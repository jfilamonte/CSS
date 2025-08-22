import { NextResponse } from "next/server"
import { getValidQuoteStatuses } from "@/lib/database-actions"

export async function GET() {
  try {
    const statuses = await getValidQuoteStatuses()
    return NextResponse.json(statuses)
  } catch (error) {
    console.error("[v0] Error fetching quote statuses:", error)
    return NextResponse.json(["pending"], { status: 500 })
  }
}
