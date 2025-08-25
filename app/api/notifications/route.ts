import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireStaff } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const supabase = await createClient()

    let query = supabase
      .from("email_notifications")
      .select("*")
      .eq("recipient_email", user.email)
      .order("created_at", { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq("status", "pending")
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff()

    const { userId, type, title, message, actionUrl } = await request.json()

    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from("email_notifications")
      .insert({
        recipient_email: userId, // Assuming userId is email for now
        notification_type: type,
        subject: title,
        body: message,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { notificationIds, markAsRead } = await request.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from("email_notifications")
      .update({
        status: markAsRead ? "read" : "pending",
        read_at: markAsRead ? new Date().toISOString() : null,
      })
      .in("id", notificationIds)
      .eq("recipient_email", user.email)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
