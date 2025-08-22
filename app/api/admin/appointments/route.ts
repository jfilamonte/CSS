import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthEdge } from "@/lib/auth-edge"

async function requireAdmin(request: NextRequest) {
  const user = await verifyAuthEdge(request)
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  return user
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)

    const appointments = [
      {
        id: "1",
        title: "Site Inspection - Johnson Garage",
        date: new Date(),
        time: "10:00 AM",
        customer: "Mike Johnson",
        staff: "John Smith",
        type: "Site Visit",
        status: "scheduled" as const,
      },
      {
        id: "2",
        title: "Quote Presentation - Davis Commercial",
        date: new Date(),
        time: "2:00 PM",
        customer: "Sarah Davis",
        staff: "Jane Doe",
        type: "Quote Meeting",
        status: "scheduled" as const,
      },
    ]

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request)
    const data = await request.json()

    // const appointment = await prisma.appointment.create({ data })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
