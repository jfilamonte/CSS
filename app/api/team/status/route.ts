import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get team members (staff and admin roles)
    const { data: teamMembers, error: teamError } = await supabase
      .from("users")
      .select("id, first_name, last_name, role, is_active")
      .in("role", ["ADMIN", "STAFF"])
      .eq("is_active", true)

    if (teamError) {
      console.error("Error fetching team members:", teamError)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    // Get today's date range
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Get appointments for each team member
    const teamWithSchedules = await Promise.all(
      (teamMembers || []).map(async (member) => {
        const { data: appointments } = await supabase
          .from("appointments")
          .select(`
            id,
            scheduled_time,
            appointment_type,
            status,
            customer:users!appointments_customer_id_fkey(first_name, last_name)
          `)
          .eq("assigned_to", member.id)
          .gte("scheduled_date", todayStart.toISOString())
          .lt("scheduled_date", todayEnd.toISOString())
          .order("scheduled_time", { ascending: true })

        const todaySchedule = (appointments || []).map((apt) => ({
          time: apt.scheduled_time,
          type: apt.appointment_type,
          customer: `${apt.customer?.first_name || ""} ${apt.customer?.last_name || ""}`.trim(),
          status: apt.status,
        }))

        // Determine status based on current appointments and time
        const currentHour = new Date().getHours()
        const hasCurrentAppointment = todaySchedule.some((apt) => {
          const aptHour = Number.parseInt(apt.time.split(":")[0])
          return Math.abs(aptHour - currentHour) <= 1
        })

        const status = hasCurrentAppointment ? "busy" : todaySchedule.length > 0 ? "available" : "available"

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          role: member.role,
          status,
          currentAppointments: todaySchedule.length,
          todaySchedule,
        }
      }),
    )

    return NextResponse.json(teamWithSchedules)
  } catch (error) {
    console.error("Error fetching team status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
