"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, DollarSign, TrendingUp } from "lucide-react"

interface RealTimeStats {
  activeUsers: number
  newLeadsToday: number
  quotesAwaitingApproval: number
  projectsInProgress: number
  totalRevenue: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
}

export default function RealTimeDashboard() {
  const [stats, setStats] = useState<RealTimeStats>({
    activeUsers: 0,
    newLeadsToday: 0,
    quotesAwaitingApproval: 0,
    projectsInProgress: 0,
    totalRevenue: 0,
    recentActivity: [],
  })
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource("/api/real-time/events")

    eventSource.onopen = () => {
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "stats_update":
          setStats((prev) => ({ ...prev, ...data.stats }))
          break
        case "new_activity":
          setStats((prev) => ({
            ...prev,
            recentActivity: [data.activity, ...prev.recentActivity.slice(0, 9)],
          }))
          break
        case "connected":
          setConnected(true)
          break
        case "heartbeat":
          // Keep connection alive
          break
      }
    }

    eventSource.onerror = () => {
      setConnected(false)
    }

    // Fetch initial stats
    fetchStats()

    return () => {
      eventSource.close()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats")
      const data = await response.json()
      setStats((prev) => ({ ...prev, ...data.stats }))
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Dashboard</h2>
        <Badge variant={connected ? "default" : "destructive"}>{connected ? "Connected" : "Disconnected"}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeadsToday}</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotesAwaitingApproval}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsInProgress}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
