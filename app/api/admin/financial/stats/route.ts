import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Get total revenue
    const totalRevenueResult = await db.invoices.aggregate({
      where: { status: "paid" },
      _sum: { total_amount: true },
    })

    // Get monthly revenue
    const monthlyRevenueResult = await db.invoices.aggregate({
      where: {
        status: "paid",
        created_at: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      _sum: { total_amount: true },
    })

    // Get outstanding invoices
    const outstandingResult = await db.invoices.aggregate({
      where: { status: "pending" },
      _sum: { total_amount: true },
    })

    // Get invoice counts
    const invoiceCounts = await db.invoices.groupBy({
      by: ["status"],
      _count: { status: true },
    })

    // Get average project value
    const avgProjectResult = await db.projects.aggregate({
      _avg: { budget: true },
    })

    // Calculate profit margin (simplified - would need cost data)
    const totalRevenue = totalRevenueResult._sum.total_amount || 0
    const estimatedCosts = totalRevenue * 0.65 // Assume 65% cost ratio
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - estimatedCosts) / totalRevenue) * 100 : 0

    const stats = {
      totalRevenue: totalRevenue,
      monthlyRevenue: monthlyRevenueResult._sum.total_amount || 0,
      outstandingInvoices: outstandingResult._sum.total_amount || 0,
      paidInvoices: invoiceCounts.find((c) => c.status === "paid")?._count.status || 0,
      overdueInvoices: invoiceCounts.find((c) => c.status === "overdue")?._count.status || 0,
      averageProjectValue: avgProjectResult._avg.budget || 0,
      profitMargin: profitMargin,
      cashFlow: (monthlyRevenueResult._sum.total_amount || 0) - estimatedCosts * 0.1, // Simplified cash flow
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching financial stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
