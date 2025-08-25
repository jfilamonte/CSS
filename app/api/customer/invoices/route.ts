import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
    })

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status.toLowerCase(),
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      downloadUrl: `/api/invoices/${invoice.id}/download`,
    }))

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
