import { type NextRequest, NextResponse } from "next/server"
import { getOptimalSalesRepAssignment } from "@/lib/database-actions"

export async function POST(request: NextRequest) {
  try {
    const { date, time } = await request.json()

    if (!date || !time) {
      return NextResponse.json({ success: false, error: "Date and time are required" }, { status: 400 })
    }

    const result = await getOptimalSalesRepAssignment(date, time)

    if (result.success && result.data && result.data.length > 0) {
      // Return the best available sales rep (first in sorted list)
      return NextResponse.json({ success: true, salesRep: result.data[0] })
    } else {
      return NextResponse.json({ success: false, error: "No available sales reps found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error getting optimal sales rep:", error)
    return NextResponse.json({ success: false, error: "Failed to get optimal sales rep" }, { status: 500 })
  }
}
