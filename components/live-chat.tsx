"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Send } from "lucide-react"

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      message: newMessage,
      sender_type: "visitor",
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")

    // Simulate auto-response
    setTimeout(() => {
      const autoResponse = {
        id: Date.now() + 1,
        message:
          "Thanks for your message! We'll get back to you shortly. For immediate assistance, please call (413) 497-2100.",
        sender_type: "admin",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, autoResponse])
    }, 1000)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-800 hover:bg-green-900 rounded-full w-14 h-14 shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border z-50 flex flex-col">
          <div className="bg-green-800 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Live Chat Support</h3>
            <p className="text-sm opacity-90">We're here to help!</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <p>Welcome! How can we help you today?</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === "visitor" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.sender_type === "visitor" ? "bg-green-800 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs opacity-75 mt-1">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="border-t p-3 flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-md text-sm"
            />
            <Button type="submit" size="sm" className="bg-green-800 hover:bg-green-900">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
