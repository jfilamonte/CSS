import { type NextRequest, NextResponse } from "next/server"
import { calendarService } from "@/lib/integrations/calendar"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    const availableSlots = await calendarService.getAvailableSlots(date)

    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error("Calendar availability error:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
