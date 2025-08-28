import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Equipment maintenance API - GET request started")

    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: equipment, error } = await supabase
      .from("equipment")
      .select("*")
      .not("last_maintenance", "is", null)
      .order("last_maintenance", { ascending: false })

    if (error) {
      console.log("[v0] Equipment maintenance query error, returning empty array")
      return NextResponse.json([])
    }

    const maintenanceRecords =
      equipment?.map((item) => ({
        id: item.id,
        equipment_id: item.id,
        equipment_name: item.name,
        date: item.last_maintenance,
        next_due: item.next_maintenance,
        type: "routine",
        status: "completed",
        notes: `Maintenance for ${item.name}`,
        created_at: item.updated_at,
      })) || []

    console.log("[v0] Equipment maintenance API - Success, found", maintenanceRecords.length, "records")
    return NextResponse.json(maintenanceRecords)
  } catch (error) {
    console.error("[v0] Equipment maintenance GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const maintenanceDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // Calculate next maintenance date based on equipment's maintenance schedule
    const { data: equipment, error: fetchError } = await supabase
      .from("equipment")
      .select("maintenance_schedule_months")
      .eq("id", body.equipment_id)
      .single()

    if (fetchError) {
      console.error("[v0] Equipment fetch error:", fetchError)
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    const nextMaintenanceDate = new Date()
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + (equipment.maintenance_schedule_months || 6))
    const nextDueDate = nextMaintenanceDate.toISOString().split("T")[0]

    const { data: updatedEquipment, error } = await supabase
      .from("equipment")
      .update({
        last_maintenance: maintenanceDate,
        next_maintenance: nextDueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.equipment_id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Equipment maintenance POST error:", error)
      return NextResponse.json({ error: "Failed to update equipment maintenance" }, { status: 500 })
    }

    const maintenanceRecord = {
      id: updatedEquipment.id,
      equipment_id: updatedEquipment.id,
      equipment_name: updatedEquipment.name,
      date: updatedEquipment.last_maintenance,
      next_due: updatedEquipment.next_maintenance,
      type: body.type || "routine",
      status: "completed",
      notes: body.notes || `Maintenance performed on ${updatedEquipment.name}`,
      created_at: updatedEquipment.updated_at,
    }

    console.log("[v0] Equipment maintenance POST - Success")
    return NextResponse.json({ maintenanceRecord })
  } catch (error) {
    console.error("[v0] Equipment maintenance POST error:", error)
    return NextResponse.json({ error: "Failed to update equipment maintenance" }, { status: 500 })
  }
}
