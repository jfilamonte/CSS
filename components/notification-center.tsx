"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, CheckCheck, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: "lead" | "quote" | "project" | "payment" | "system"
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()

    // Set up real-time updates
    const eventSource = new EventSource("/api/real-time/events")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "notification") {
        setNotifications((prev) => [data.notification, ...prev])
        toast({
          title: data.notification.title,
          description: data.notification.message,
        })
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds, markAsRead: true }),
      })

      setNotifications((prev) => prev.map((n) => (notificationIds.includes(n.id) ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lead":
        return "🎯"
      case "quote":
        return "💰"
      case "project":
        return "🏗️"
      case "payment":
        return "💳"
      case "system":
        return "⚙️"
      default:
        return "📢"
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                        !notification.is_read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead([notification.id])
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                            {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
