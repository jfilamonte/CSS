import { type NextRequest, NextResponse } from "next/server"
import { sendTimeOffNotification } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salesRepEmail, salesRepName, status, startDate, endDate, type, adminNotes } = body

    const result = await sendTimeOffNotification({
      salesRepEmail,
      salesRepName,
      status,
      startDate,
      endDate,
      type,
      adminNotes,
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending time off notification:", error)
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 })
  }
}
