import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, customerId, amount, dueDate, items } = await request.json()

    const invoiceCount = await db.invoices.count()
    const invoiceNumber = `CSS-INV-${String(invoiceCount + 1).padStart(4, "0")}`

    const invoice = await db.invoices.create({
      customer_id: customerId,
      invoice_number: invoiceNumber,
      amount: amount,
      total_amount: amount * 1.08, // Add 8% tax
      tax_amount: amount * 0.08,
      status: "pending",
      due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      invoice_type: "project",
      line_items: items || [],
    })

    // Send invoice email notification
    await fetch("/api/notifications/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id }),
    })

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
