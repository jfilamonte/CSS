import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const recipientId = searchParams.get("recipientId")

    const messages = await db.messages.findManyWithJoin(
      {
        projectId,
        recipientId,
        userId: user.id,
      },
      {
        join: {
          sender: {
            select: ["firstName", "lastName", "role"],
          },
        },
        orderBy: { created_at: "asc" },
        limit: 100,
      },
    )

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      sender_name: `${msg.sender.firstName} ${msg.sender.lastName}`,
      sender_role: msg.sender.role,
      timestamp: msg.created_at.toISOString(),
      is_read: msg.is_read,
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, projectId, recipientId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

    const message = await db.messages.createWithJoin({
      content: content.trim(),
      sender_id: user.id,
      recipient_id: recipientId,
      project_id: projectId,
      is_read: false,
    })

    // Create notification for recipient
    if (recipientId) {
      await db.notifications.create({
        user_id: recipientId,
        type: "message",
        title: "New Message",
        message: `${user.firstName} ${user.lastName}: ${content.substring(0, 100)}...`,
        action_url: `/messages?project=${projectId}`,
        is_read: false,
      })
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        sender_name: `${user.firstName} ${user.lastName}`,
        sender_role: user.role,
        timestamp: message.created_at.toISOString(),
        is_read: message.is_read,
      },
    })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
