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

    // Get today's date range
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Get week date range
    const weekStart = new Date(todayStart.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get scheduling stats
    const [todayAppointments, weekAppointments, pendingReschedules, unreadMessages, activeChats, pendingNotifications] =
      await Promise.all([
        // Today's appointments
        supabase
          .from("appointments")
          .select("id")
          .gte("scheduled_date", todayStart.toISOString())
          .lt("scheduled_date", todayEnd.toISOString())
          .eq("status", "scheduled"),

        // Week's appointments
        supabase
          .from("appointments")
          .select("id")
          .gte("scheduled_date", weekStart.toISOString())
          .lt("scheduled_date", weekEnd.toISOString())
          .in("status", ["scheduled", "confirmed"]),

        // Pending reschedules
        supabase
          .from("appointments")
          .select("id")
          .eq("status", "reschedule_requested"),

        // Unread messages
        supabase
          .from("messages")
          .select("id")
          .eq("is_read", false)
          .neq("sender_id", user.id),

        // Active chats (messages in last 24 hours)
        supabase
          .from("messages")
          .select("sender_id, recipient_id")
          .gte("created_at", todayStart.toISOString()),

        // Pending notifications
        supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_read", false),
      ])

    // Calculate available slots (simplified - would be more complex in real implementation)
    const availableSlots = 24 // Placeholder

    // Calculate team utilization (simplified)
    const teamUtilization = 75 // Placeholder

    // Count unique active chats
    const uniqueChats = new Set()
    if (activeChats.data) {
      activeChats.data.forEach((msg) => {
        const chatId = [msg.sender_id, msg.recipient_id].sort().join("-")
        uniqueChats.add(chatId)
      })
    }

    const stats = {
      todayAppointments: todayAppointments.data?.length || 0,
      weekAppointments: weekAppointments.data?.length || 0,
      pendingReschedules: pendingReschedules.data?.length || 0,
      availableSlots,
      unreadMessages: unreadMessages.data?.length || 0,
      activeChats: uniqueChats.size,
      pendingNotifications: pendingNotifications.data?.length || 0,
      teamUtilization,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching scheduling stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
