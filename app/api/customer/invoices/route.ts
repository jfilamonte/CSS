import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !["customer", "admin", "staff"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await db.invoices.findMany({
      customer_id: user.role?.toLowerCase() === "customer" ? user.id : undefined,
    })

    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.invoice_number,
      amount: invoice.total_amount,
      status: invoice.status?.toLowerCase(),
      dueDate: invoice.due_date,
      paidDate: invoice.paid_at,
      downloadUrl: `/api/invoices/${invoice.id}/download`,
    }))

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
