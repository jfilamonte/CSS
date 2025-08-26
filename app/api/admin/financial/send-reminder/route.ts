import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = await request.json()

    // Get invoice details
    const invoice = await db.invoices.findFirst({
      id: invoiceId,
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get customer details
    const customer = await db.users.findFirst({
      id: invoice.customer_id,
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Send payment reminder email
    await db.email_notifications.create({
      recipient_email: customer.email,
      recipient_type: "customer",
      subject: `Payment Reminder - Invoice ${invoice.invoice_number}`,
      body: `Dear ${customer.first_name},\n\nThis is a friendly reminder that invoice ${invoice.invoice_number} for $${invoice.total_amount} is due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nPlease log into your customer portal to make a payment.\n\nThank you,\nCrafted Surface Solutions`,
      notification_type: "payment_reminder",
      related_id: invoiceId,
      status: "pending",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending payment reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
