import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "super_admin"].includes(user.role?.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await db.query(`
      SELECT 
        i.id,
        i.invoice_number as number,
        u.first_name || ' ' || u.last_name as customer_name,
        i.total_amount as amount,
        i.status,
        i.due_date,
        i.created_at,
        p.title as project_title
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      LEFT JOIN projects p ON i.estimate_id = (
        SELECT id FROM estimates WHERE customer_id = i.customer_id LIMIT 1
      )
      ORDER BY i.created_at DESC
    `)

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
