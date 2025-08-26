"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MessageSquare, Bell, Users, Phone, Video, Mail, Settings, Search } from "lucide-react"
import EnhancedCalendar from "./enhanced-calendar"
import SmartAppointmentBooking from "./smart-appointment-booking"
import LiveMessaging from "./live-messaging"
import NotificationCenter from "./notification-center"
import AvailabilityManager from "./availability-manager"

interface SchedulingStats {
  todayAppointments: number
  weekAppointments: number
  pendingReschedules: number
  availableSlots: number
  unreadMessages: number
  activeChats: number
  pendingNotifications: number
  teamUtilization: number
}

interface TeamMember {
  id: string
  name: string
  role: string
  status: "available" | "busy" | "offline"
  currentAppointments: number
  todaySchedule: Array<{
    time: string
    type: string
    customer: string
    status: string
  }>
}

interface CommunicationThread {
  id: string
  type: "project" | "quote" | "support"
  participants: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  priority: "low" | "medium" | "high"
}

export default function SchedulingCommunicationDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<SchedulingStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    pendingReschedules: 0,
    availableSlots: 0,
    unreadMessages: 0,
    activeChats: 0,
    pendingNotifications: 0,
    teamUtilization: 0,
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [communicationThreads, setCommunicationThreads] = useState<CommunicationThread[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()

    // Set up real-time updates
    const eventSource = new EventSource("/api/real-time/events")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "appointment_update") {
        loadDashboardData()
      } else if (data.type === "new_message") {
        setStats((prev) => ({ ...prev, unreadMessages: prev.unreadMessages + 1 }))
      } else if (data.type === "team_status_update") {
        updateTeamMemberStatus(data.memberId, data.status)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, teamRes, threadsRes] = await Promise.all([
        fetch("/api/scheduling/stats"),
        fetch("/api/team/status"),
        fetch("/api/communications/threads"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData)
      }

      if (threadsRes.ok) {
        const threadsData = await threadsRes.json()
        setCommunicationThreads(threadsData)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTeamMemberStatus = (memberId: string, status: string) => {
    setTeamMembers((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, status: status as any } : member)),
    )
  }

  const handleBulkReschedule = async () => {
    try {
      const response = await fetch("/api/scheduling/bulk-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate.toISOString() }),
      })

      if (response.ok) {
        await loadDashboardData()
        alert("Bulk reschedule completed successfully!")
      }
    } catch (error) {
      console.error("Error with bulk reschedule:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading scheduling dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Scheduling & Communication Hub</h1>
          <p className="text-green-600">Manage appointments, team coordination, and customer communications</p>
        </div>
        <div className="flex gap-2">
          <NotificationCenter />
          <SmartAppointmentBooking onAppointmentCreated={loadDashboardData} />
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reschedules</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReschedules}</div>
            <p className="text-xs text-muted-foreground">pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableSlots}</div>
            <p className="text-xs text-muted-foreground">slots today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingNotifications}</div>
            <p className="text-xs text-muted-foreground">pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Load</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamUtilization}%</div>
            <p className="text-xs text-muted-foreground">utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="team">Team Status</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Upcoming appointments and team assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.slice(0, 3).map((member) => (
                    <div key={member.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{member.name}</h4>
                          <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">{member.currentAppointments} appointments</span>
                      </div>
                      <div className="space-y-1">
                        {member.todaySchedule.slice(0, 2).map((appointment, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {appointment.time} - {appointment.customer}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {appointment.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Activity</CardTitle>
                <CardDescription>Recent messages and priority threads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communicationThreads.slice(0, 4).map((thread) => (
                    <div key={thread.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(thread.priority)}>{thread.priority}</Badge>
                          <span className="text-sm font-medium">{thread.type}</span>
                        </div>
                        {thread.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">{thread.lastMessageTime}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Quick Actions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkReschedule}>
                    <Clock className="w-4 h-4 mr-1" />
                    Bulk Reschedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Send Reminders
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <Phone className="w-6 h-6 mb-2" />
                  <span className="text-sm">Call Customer</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <Video className="w-6 h-6 mb-2" />
                  <span className="text-sm">Video Call</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span className="text-sm">Send Message</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <Bell className="w-6 h-6 mb-2" />
                  <span className="text-sm">Send Reminder</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Calendar View</CardTitle>
              <CardDescription>Comprehensive scheduling with team coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedCalendar />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Status & Workload</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search team members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers
                  .filter(
                    (member) =>
                      (filterStatus === "all" || member.status === filterStatus) &&
                      (searchTerm === "" || member.name.toLowerCase().includes(searchTerm.toLowerCase())),
                  )
                  .map((member) => (
                    <Card key={member.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{member.name}</CardTitle>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                          <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Today's Load:</span>
                            <span className="font-medium">{member.currentAppointments} appointments</span>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Today's Schedule:</h5>
                            {member.todaySchedule.length > 0 ? (
                              <div className="space-y-1">
                                {member.todaySchedule.map((appointment, index) => (
                                  <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                                    <span>{appointment.time}</span>
                                    <span className="truncate ml-2">{appointment.customer}</span>
                                    <Badge variant="outline" className="text-xs ml-1">
                                      {appointment.type}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">No appointments scheduled</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Message
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                              <Calendar className="w-3 h-3 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Threads</CardTitle>
              <CardDescription>Manage all customer and team communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communicationThreads.map((thread) => (
                  <div key={thread.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(thread.priority)}>{thread.priority}</Badge>
                        <span className="font-medium capitalize">{thread.type} Thread</span>
                        <span className="text-sm text-gray-500">{thread.participants.length} participants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {thread.unreadCount > 0 && <Badge variant="destructive">{thread.unreadCount} unread</Badge>}
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{thread.lastMessage}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Participants: {thread.participants.join(", ")}</span>
                      <span>{thread.lastMessageTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <AvailabilityManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduling Metrics</CardTitle>
                <CardDescription>Performance and efficiency insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <span className="font-medium">2.3 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Appointment Completion Rate</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">4.8/5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>No-Show Rate</span>
                    <span className="font-medium">3.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Metrics</CardTitle>
                <CardDescription>Message volume and response analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Messages Today</span>
                    <span className="font-medium">127</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <span className="font-medium">18 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Resolution Rate</span>
                    <span className="font-medium">89.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">4.6/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Messaging Component */}
      <LiveMessaging />
    </div>
  )
}
