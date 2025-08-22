import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const staff = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "STAFF"] },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Staff API error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
