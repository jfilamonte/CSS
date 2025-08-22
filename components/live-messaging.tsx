"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, X, Phone, Video } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_role: string
  timestamp: string
  is_read: boolean
}

interface LiveMessagingProps {
  projectId?: string
  recipientId?: string
  recipientName?: string
}

export default function LiveMessaging({ projectId, recipientId, recipientName }: LiveMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      setupRealTimeConnection()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [isOpen, projectId, recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const setupRealTimeConnection = () => {
    const eventSource = new EventSource("/api/real-time/events")
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data.message])
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1)
          toast({
            title: "New Message",
            description: `${data.message.sender_name}: ${data.message.content.substring(0, 50)}...`,
          })
        }
      } else if (data.type === "typing_indicator") {
        setIsTyping(data.isTyping && data.userId !== data.currentUserId)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams()
      if (projectId) params.append("projectId", projectId)
      if (recipientId) params.append("recipientId", recipientId)

      const response = await fetch(`/api/messages?${params}`)
      const data = await response.json()
      setMessages(data.messages || [])
      setUnreadCount(0)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          projectId,
          recipientId,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        // Message will be added via SSE
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700 shadow-lg relative"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      ) : (
        <Card className="w-80 h-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{recipientName ? `Chat with ${recipientName}` : "Messages"}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Disconnected"}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_role === "CUSTOMER" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_role === "CUSTOMER" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">{message.sender_name}</span>
                        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
