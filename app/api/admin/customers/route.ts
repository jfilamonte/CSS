import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    await requireAdmin()

    const customers = await db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(customers || [])
  } catch (error) {
    console.error("Customers API error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
