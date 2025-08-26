import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !["customer", "admin", "staff"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointments = await db.appointments.findMany({
      customer_id: user.role?.toLowerCase() === "customer" ? user.id : undefined,
    })

    const formattedAppointments = appointments.map((apt: any) => ({
      id: apt.id,
      date: apt.scheduled_date,
      time: apt.scheduled_time,
      type: apt.appointment_type,
      status: apt.status,
      notes: apt.customer_notes,
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !["customer", "admin", "staff"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, time, type, notes } = await request.json()

    const appointment = await db.appointments.create({
      customer_id: user.id,
      scheduled_date: date,
      scheduled_time: time,
      appointment_type: type,
      status: "scheduled",
      customer_notes: notes,
      duration_minutes: 60,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
