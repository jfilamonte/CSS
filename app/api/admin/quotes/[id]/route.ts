import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const { status } = await request.json()
    const quoteId = params.id

    const updatedQuote = await db.quote.update(quoteId, {
      status,
      ...(status === "SENT" && { sentAt: new Date() }),
      ...(status === "ACCEPTED" && { acceptedAt: new Date() }),
      ...(status === "REJECTED" && { rejectedAt: new Date() }),
      updatedAt: new Date(),
    })

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error("Update quote error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
