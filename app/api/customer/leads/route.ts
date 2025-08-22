import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leads = await db.lead.findMany({
      filters: { submittedById: user.id },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Customer leads error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadData = await request.json()

    const newLead = await db.lead.create({
      fullName: leadData.fullName,
      email: leadData.email,
      phone: leadData.phone,
      projectType: leadData.projectType,
      squareFootage: leadData.squareFootage,
      timeline: leadData.timeline,
      address: leadData.address,
      city: leadData.city,
      state: leadData.state,
      zipCode: leadData.zipCode,
      details: leadData.details,
      wantsAppointment: leadData.wantsAppointment,
      submittedById: user.id,
    })

    return NextResponse.json(newLead)
  } catch (error) {
    console.error("Create lead error:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
