import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyAuth, requireStaff } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const supabase = await createClient()

    const { data: notifications } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("recipient_email", user.email)
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff(request)

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

    if (error) throw error

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds, markAsRead } = await request.json()

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        user_id: user.id,
      },
      data: {
        is_read: markAsRead,
        read_at: markAsRead ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
