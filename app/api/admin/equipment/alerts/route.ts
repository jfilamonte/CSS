import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Equipment alerts API - GET request started")

    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("*")
      .eq("status", "active")

    if (equipmentError) {
      console.log("[v0] Equipment table not found, returning empty alerts")
      return NextResponse.json([])
    }

    const alerts = []
    const currentDate = new Date()

    for (const item of equipment || []) {
      if (item.next_maintenance) {
        const nextMaintenanceDate = new Date(item.next_maintenance)
        const daysUntilMaintenance = Math.ceil(
          (nextMaintenanceDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
        )

        let alertType = "inspection_required"
        let priority = "low"

        if (daysUntilMaintenance < 0) {
          alertType = "overdue"
          priority = "high"
        } else if (daysUntilMaintenance <= 7) {
          alertType = "due_soon"
          priority = "medium"
        }

        if (daysUntilMaintenance <= 30) {
          alerts.push({
            id: `alert-${item.id}`,
            equipment_id: item.id,
            equipment_name: item.name,
            alert_type: alertType,
            due_date: item.next_maintenance,
            priority: priority,
          })
        }
      }
    }

    console.log("[v0] Equipment alerts API - Success, found", alerts.length, "alerts")
    return NextResponse.json(alerts)
  } catch (error) {
    console.error("[v0] Equipment alerts GET error:", error)
    return NextResponse.json([])
  }
}
