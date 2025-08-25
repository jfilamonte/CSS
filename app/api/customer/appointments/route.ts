import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { customerId: user.id },
      include: {
        staff: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    })

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      date: apt.scheduledDate.toISOString().split("T")[0],
      time: apt.scheduledDate.toTimeString().slice(0, 5),
      type: apt.type,
      status: apt.status,
      staff: `${apt.staff?.firstName} ${apt.staff?.lastName}`,
      notes: apt.notes,
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
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, time, type, notes } = await request.json()

    const scheduledDate = new Date(`${date}T${time}:00`)

    const appointment = await prisma.appointment.create({
      data: {
        customerId: user.id,
        scheduledDate,
        type,
        status: "SCHEDULED",
        notes,
        duration: 60, // Default 1 hour
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
