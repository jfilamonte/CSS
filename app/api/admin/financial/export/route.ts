import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const dateRange = searchParams.get("range")

    // Calculate date range
    const now = new Date()
    let startDate: Date
    const endDate = now

    switch (dateRange) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    let reportData: any = {}

    switch (reportType) {
      case "revenue":
        reportData = await generateRevenueReport(startDate, endDate)
        break
      case "profit-loss":
        reportData = await generateProfitLossReport(startDate, endDate)
        break
      case "cash-flow":
        reportData = await generateCashFlowReport(startDate, endDate)
        break
      case "tax-summary":
        reportData = await generateTaxSummaryReport(startDate, endDate)
        break
      case "customer-analysis":
        reportData = await generateCustomerAnalysisReport(startDate, endDate)
        break
      case "project-profitability":
        reportData = await generateProjectProfitabilityReport(startDate, endDate)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // In a real app, generate PDF using a library like puppeteer or jsPDF
    const reportContent = JSON.stringify(reportData, null, 2)

    return new NextResponse(reportContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${reportType}-${dateRange}-report.json"`,
      },
    })
  } catch (error) {
    console.error("Error generating financial report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateRevenueReport(startDate: Date, endDate: Date) {
  const revenue = await db.query(
    `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      SUM(total_amount) as revenue,
      COUNT(*) as invoice_count
    FROM invoices 
    WHERE status = 'paid' 
    AND created_at BETWEEN $1 AND $2
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `,
    [startDate, endDate],
  )

  return { type: "revenue", period: { startDate, endDate }, data: revenue }
}

async function generateProfitLossReport(startDate: Date, endDate: Date) {
  const revenue = await db.invoices.aggregate({
    where: { status: "paid", created_at: { gte: startDate, lte: endDate } },
    _sum: { total_amount: true },
  })

  // Simplified P&L - in real app, track actual expenses
  const totalRevenue = revenue._sum.total_amount || 0
  const estimatedCosts = totalRevenue * 0.65
  const operatingExpenses = totalRevenue * 0.15
  const netProfit = totalRevenue - estimatedCosts - operatingExpenses

  return {
    type: "profit-loss",
    period: { startDate, endDate },
    data: {
      revenue: totalRevenue,
      costOfGoodsSold: estimatedCosts,
      operatingExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    },
  }
}

async function generateCashFlowReport(startDate: Date, endDate: Date) {
  const cashInflow = await db.invoices.aggregate({
    where: { status: "paid", paid_at: { gte: startDate, lte: endDate } },
    _sum: { total_amount: true },
  })

  const cashOutflow = (cashInflow._sum.total_amount || 0) * 0.7 // Simplified

  return {
    type: "cash-flow",
    period: { startDate, endDate },
    data: {
      cashInflow: cashInflow._sum.total_amount || 0,
      cashOutflow,
      netCashFlow: (cashInflow._sum.total_amount || 0) - cashOutflow,
    },
  }
}

async function generateTaxSummaryReport(startDate: Date, endDate: Date) {
  const taxData = await db.invoices.aggregate({
    where: { status: "paid", created_at: { gte: startDate, lte: endDate } },
    _sum: { total_amount: true, tax_amount: true },
  })

  return {
    type: "tax-summary",
    period: { startDate, endDate },
    data: {
      totalRevenue: taxData._sum.total_amount || 0,
      totalTaxCollected: taxData._sum.tax_amount || 0,
      taxableIncome: (taxData._sum.total_amount || 0) - (taxData._sum.tax_amount || 0),
    },
  }
}

async function generateCustomerAnalysisReport(startDate: Date, endDate: Date) {
  const customerData = await db.query(
    `
    SELECT 
      u.first_name || ' ' || u.last_name as customer_name,
      COUNT(i.id) as invoice_count,
      SUM(i.total_amount) as total_spent,
      AVG(i.total_amount) as average_invoice,
      MAX(i.created_at) as last_invoice_date
    FROM users u
    JOIN invoices i ON u.id = i.customer_id
    WHERE i.created_at BETWEEN $1 AND $2
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY total_spent DESC
  `,
    [startDate, endDate],
  )

  return {
    type: "customer-analysis",
    period: { startDate, endDate },
    data: customerData,
  }
}

async function generateProjectProfitabilityReport(startDate: Date, endDate: Date) {
  const projectData = await db.query(
    `
    SELECT 
      sp.name as package_type,
      COUNT(p.id) as project_count,
      AVG(e.total_amount) as average_project_value,
      SUM(e.total_amount) as total_revenue
    FROM projects p
    JOIN estimates e ON p.id = e.project_id
    JOIN service_packages sp ON e.package_id = sp.id
    WHERE p.created_at BETWEEN $1 AND $2
    GROUP BY sp.name
    ORDER BY total_revenue DESC
  `,
    [startDate, endDate],
  )

  return {
    type: "project-profitability",
    period: { startDate, endDate },
    data: projectData,
  }
}
