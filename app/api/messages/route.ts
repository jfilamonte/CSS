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
    const projectId = searchParams.get("projectId")
    const recipientId = searchParams.get("recipientId")

    const whereClause: any = {
      OR: [{ sender_id: user.id }, { recipient_id: user.id }],
    }

    if (projectId) {
      whereClause.project_id = projectId
    }

    if (recipientId) {
      whereClause.OR = [
        { sender_id: user.id, recipient_id: recipientId },
        { sender_id: recipientId, recipient_id: user.id },
      ]
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { created_at: "asc" },
      take: 100,
    })

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

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        sender_id: user.id,
        recipient_id: recipientId,
        project_id: projectId,
        is_read: false,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    })

    // Create notification for recipient
    if (recipientId) {
      await prisma.notification.create({
        data: {
          user_id: recipientId,
          type: "message",
          title: "New Message",
          message: `${user.firstName} ${user.lastName}: ${content.substring(0, 100)}...`,
          action_url: `/messages?project=${projectId}`,
          is_read: false,
        },
      })
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        sender_name: `${message.sender.firstName} ${message.sender.lastName}`,
        sender_role: message.sender.role,
        timestamp: message.created_at.toISOString(),
        is_read: message.is_read,
      },
    })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
