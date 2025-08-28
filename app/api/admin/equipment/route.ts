import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !["admin", "staff"].includes(user.role?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: equipment, error } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(equipment || [])
  } catch (error) {
    console.error("[v0] Equipment GET error:", error)
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
    console.log("[v0] Equipment POST request body:", JSON.stringify(body, null, 2))

    const supabase = await createClient()

    const validStatuses = ["available", "in_use", "maintenance", "retired"]
    const status =
      body.status && validStatuses.includes(body.status.toLowerCase()) ? body.status.toLowerCase() : "available" // Default to "available" which matches the constraint

    console.log("[v0] Using status value:", status)

    const equipmentData = {
      name: body.name,
      category: body.category,
      model: body.model,
      serial_number: body.serial_number,
      purchase_date: body.purchase_date,
      purchase_cost: body.purchase_cost ? Number.parseFloat(body.purchase_cost) : null,
      maintenance_schedule_months: body.maintenance_schedule_months
        ? Number.parseInt(body.maintenance_schedule_months)
        : null,
      last_maintenance: body.last_maintenance || null,
      next_maintenance: body.next_maintenance || null,
      status: status,
      current_value: body.current_value ? Number.parseFloat(body.current_value) : null,
    }

    console.log("[v0] Equipment data to insert:", JSON.stringify(equipmentData, null, 2))

    const { data: equipment, error } = await supabase.from("equipment").insert([equipmentData]).select().single()

    if (error) throw error

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error("[v0] Equipment POST error:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}
