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

    // Get recent messages grouped by conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        sender_id,
        recipient_id,
        project_id,
        is_read,
        sender:users!messages_sender_id_fkey(first_name, last_name),
        recipient:users!messages_recipient_id_fkey(first_name, last_name),
        project:projects(id, title)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(100)

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Group messages into threads
    const threadsMap = new Map()

    messages?.forEach((message) => {
      const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id
      const threadKey = message.project_id ? `project-${message.project_id}` : `user-${otherUserId}`

      if (!threadsMap.has(threadKey)) {
        const otherUser = message.sender_id === user.id ? message.recipient : message.sender
        const threadType = message.project_id
          ? "project"
          : message.content.toLowerCase().includes("quote")
            ? "quote"
            : "support"

        threadsMap.set(threadKey, {
          id: threadKey,
          type: threadType,
          participants: message.project_id
            ? [`${otherUser.first_name} ${otherUser.last_name}`, "Project Team"]
            : [`${otherUser.first_name} ${otherUser.last_name}`],
          lastMessage: message.content,
          lastMessageTime: new Date(message.created_at).toLocaleString(),
          unreadCount: 0,
          priority: threadType === "project" ? "high" : "medium",
          messages: [],
        })
      }

      const thread = threadsMap.get(threadKey)
      thread.messages.push(message)

      // Update unread count
      if (!message.is_read && message.sender_id !== user.id) {
        thread.unreadCount++
      }

      // Update last message if this is more recent
      if (new Date(message.created_at) > new Date(thread.lastMessageTime)) {
        thread.lastMessage = message.content
        thread.lastMessageTime = new Date(message.created_at).toLocaleString()
      }
    })

    const threads = Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
    )

    return NextResponse.json(threads)
  } catch (error) {
    console.error("Error fetching communication threads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
