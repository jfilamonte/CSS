import { google } from "googleapis"

const calendar = google.calendar("v3")

async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })

  return auth
}

export async function createGoogleCalendarEvent(eventData: {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  attendeeEmails: string[]
}) {
  try {
    const auth = await getGoogleAuth()

    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: "America/New_York",
      },
      attendees: eventData.attendeeEmails.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    }

    const response = await calendar.events.insert({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      requestBody: event,
    })

    return {
      success: true,
      eventId: response.data.id,
      message: "Calendar event created successfully",
    }
  } catch (error) {
    console.error("Error creating Google Calendar event:", error)
    return { success: false, error }
  }
}

export async function getAvailableSlots(date: string) {
  try {
    const auth = await getGoogleAuth()

    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    const response = await calendar.events.list({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    })

    const busySlots =
      response.data.items?.map((event) => ({
        start: event.start?.dateTime,
        end: event.end?.dateTime,
      })) || []

    // Generate available slots (9 AM to 5 PM, 1-hour slots)
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(`${date}T${hour.toString().padStart(2, "0")}:00:00`)
      const slotEnd = new Date(`${date}T${(hour + 1).toString().padStart(2, "0")}:00:00`)

      const isAvailable = !busySlots.some((busy) => {
        const busyStart = new Date(busy.start!)
        const busyEnd = new Date(busy.end!)
        return slotStart < busyEnd && slotEnd > busyStart
      })

      slots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        available: isAvailable,
      })
    }

    return slots
  } catch (error) {
    console.error("Error fetching available slots:", error)
    return []
  }
}

export async function createEvent(eventData: {
  title: string
  description: string
  startTime: string
  endTime: string
  attendeeEmail: string
  location?: string
}) {
  return await createGoogleCalendarEvent({
    summary: eventData.title,
    description: eventData.description,
    startDateTime: eventData.startTime,
    endDateTime: eventData.endTime,
    attendeeEmails: [eventData.attendeeEmail],
  })
}

export const calendarService = {
  createEvent,
  getAvailableSlots,
  createGoogleCalendarEvent,
}
