import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await db.project.findMany({
      filters: { customerId: user.id },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Customer projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
