import { type NextRequest, NextResponse } from "next/server"
import { calendarService } from "@/lib/integrations/calendar"
import { verifyAuth } from "@/lib/auth"
import { sendWebhook, WEBHOOK_EVENTS } from "@/lib/integrations/webhooks"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, startTime, endTime, location } = await request.json()

    const result = await calendarService.createEvent({
      title,
      description,
      startTime,
      endTime,
      attendeeEmail: user.email,
      location,
    })

    if (result.success) {
      // Trigger webhook for appointment booking
      await sendWebhook(WEBHOOK_EVENTS.APPOINTMENT_BOOKED, {
        userId: user.id,
        eventId: result.eventId,
        title,
        startTime,
        endTime,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Calendar booking error:", error)
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 })
  }
}
