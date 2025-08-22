import { type NextRequest, NextResponse } from "next/server"
import { getIntelligentAvailableTimeSlots } from "@/lib/database-actions"

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    const result = await getIntelligentAvailableTimeSlots(date)

    if (result.success) {
      return NextResponse.json({ success: true, slots: result.data })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error getting available slots:", error)
    return NextResponse.json({ success: false, error: "Failed to get available slots" }, { status: 500 })
  }
}
