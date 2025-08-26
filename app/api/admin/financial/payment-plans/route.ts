import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentPlans = await db.query(`
      SELECT 
        pp.id,
        u.first_name || ' ' || u.last_name as customer_name,
        pp.total_amount,
        pp.monthly_payment,
        pp.remaining_balance,
        pp.next_payment_date,
        pp.status,
        pp.created_at
      FROM payment_plans pp
      JOIN users u ON pp.customer_id = u.id
      ORDER BY pp.created_at DESC
    `)

    return NextResponse.json(paymentPlans)
  } catch (error) {
    console.error("Error fetching payment plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customerId, totalAmount, monthlyPayment, startDate } = await request.json()

    const paymentPlan = await db.paymentPlans.create({
      customer_id: customerId,
      total_amount: totalAmount,
      monthly_payment: monthlyPayment,
      remaining_balance: totalAmount,
      next_payment_date: startDate,
      status: "active",
    })

    return NextResponse.json({ success: true, paymentPlan })
  } catch (error) {
    console.error("Error creating payment plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
