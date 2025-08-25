import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: user.id,
        ...(unreadOnly && { is_read: false }),
      },
      orderBy: { created_at: "desc" },
      take: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, type, title, message, actionUrl } = await request.json()

    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        is_read: false,
      },
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Error creating notification:", error)
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
