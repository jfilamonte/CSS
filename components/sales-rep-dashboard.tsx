"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Users, Settings, LogOut, Plus, AlertCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import SalesRepCalendar from "@/components/sales-rep-calendar"
import { requestTimeOff, blockSalesRepTime } from "@/lib/actions"

interface SalesRepDashboardProps {
  user: {
    first_name: string
    last_name: string
    role: string
  }
}

export default function SalesRepDashboard({ user }: SalesRepDashboardProps) {
  const [appointments, setAppointments] = useState([])
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const [blockedTimes, setBlockedTimes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false)
  const [showBlockTimeDialog, setShowBlockTimeDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      // Load appointments assigned to this sales rep
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select(`
          *,
          quotes (
            customer_name,
            customer_email,
            customer_phone
          )
        `)
        .eq("assigned_to", authUser.id)
        .gte("appointment_date", new Date().toISOString().split("T")[0])
        .order("appointment_date", { ascending: true })

      const { data: timeOffData } = await supabase
        .from("sales_rep_time_off")
        .select("*")
        .eq("sales_rep_id", authUser.id)
        .order("created_at", { ascending: false })

      const { data: blockedTimesData } = await supabase
        .from("sales_rep_blocked_times")
        .select("*")
        .eq("sales_rep_id", authUser.id)
        .eq("is_active", true)
        .order("start_date", { ascending: true })

      setAppointments(appointmentsData || [])
      setTimeOffRequests(timeOffData || [])
      setBlockedTimes(blockedTimesData || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTimeOffRequest(formData: FormData) {
    const result = await requestTimeOff(formData)
    if (result.success) {
      setShowTimeOffDialog(false)
      loadDashboardData() // Reload to show new request
    } else {
      console.error("Error requesting time off:", result.error)
    }
  }

  async function handleBlockTimeRequest(formData: FormData) {
    const result = await blockSalesRepTime(formData)
    if (result.success) {
      setShowBlockTimeDialog(false)
      loadDashboardData() // Reload to show new blocked time
    } else {
      console.error("Error blocking time:", result.error)
    }
  }

  async function handleRemoveBlockedTime(blockedTimeId: string) {
    try {
      const { error } = await supabase
        .from("sales_rep_blocked_times")
        .update({ is_active: false })
        .eq("id", blockedTimeId)

      if (error) {
        console.error("Error removing blocked time:", error)
      } else {
        loadDashboardData() // Reload to update the list
      }
    } catch (error) {
      console.error("Error removing blocked time:", error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/sales-portal"
  }

  const todayAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date).toDateString() === new Date().toDateString(),
  )

  const upcomingAppointments = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date) > new Date() &&
      new Date(apt.appointment_date).toDateString() !== new Date().toDateString(),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.first_name} {user.last_name}
              </h1>
              <p className="text-sm text-gray-600">Sales Representative Dashboard</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  appointments.filter((apt) => {
                    const aptDate = new Date(apt.appointment_date)
                    const today = new Date()
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return aptDate >= today && aptDate <= weekFromNow
                  }).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Hours</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-green-600">7AM - 8PM M-F</div>
              <div className="text-sm text-gray-600">9AM - 12PM Sat</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <SalesRepCalendar appointments={appointments} />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Business Hours</CardTitle>
                <CardDescription>Default availability for appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Monday - Friday</h4>
                      <p className="text-sm text-gray-600">7:00 AM - 8:00 PM</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Saturday</h4>
                      <p className="text-sm text-gray-600">9:00 AM - 12:00 PM</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Block Time</h4>
                        <p className="text-sm text-gray-600">
                          Block specific times when you're not available for appointments
                        </p>
                      </div>
                      <Dialog open={showBlockTimeDialog} onOpenChange={setShowBlockTimeDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Blocked Time
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Block Time</DialogTitle>
                          </DialogHeader>
                          <form action={handleBlockTimeRequest} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input type="date" name="startDate" required />
                              </div>
                              <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input type="date" name="endDate" required />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input type="time" name="startTime" required />
                              </div>
                              <div>
                                <Label htmlFor="endTime">End Time</Label>
                                <Input type="time" name="endTime" required />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="reason">Reason</Label>
                              <Select name="reason" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="training">Training</SelectItem>
                                  <SelectItem value="personal">Personal</SelectItem>
                                  <SelectItem value="lunch">Lunch Break</SelectItem>
                                  <SelectItem value="travel">Travel Time</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setShowBlockTimeDialog(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Block Time</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {blockedTimes.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Current Blocked Times</h5>
                        {blockedTimes.map((blockedTime) => (
                          <div
                            key={blockedTime.id}
                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium capitalize">{blockedTime.reason}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Blocked
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(blockedTime.start_date).toLocaleDateString()} -{" "}
                                {new Date(blockedTime.end_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                {blockedTime.start_time} - {blockedTime.end_time}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBlockedTime(blockedTime.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeoff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Off Requests</CardTitle>
                <CardDescription>Manage your vacation and time off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Dialog open={showTimeOffDialog} onOpenChange={setShowTimeOffDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Request Time Off
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request Time Off</DialogTitle>
                      </DialogHeader>
                      <form action={handleTimeOffRequest} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input type="date" name="startDate" required />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input type="date" name="endDate" required />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select name="type" defaultValue="vacation">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vacation">Vacation</SelectItem>
                              <SelectItem value="sick">Sick Leave</SelectItem>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="family">Family Emergency</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            name="reason"
                            placeholder="Please provide details about your time off request..."
                            required
                          />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                              <p className="font-medium">Important:</p>
                              <p>
                                Time off requests should be submitted at least 2 weeks in advance when possible.
                                Emergency requests will be reviewed as soon as possible.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowTimeOffDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Submit Request</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {timeOffRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No time off requests</p>
                      <p className="text-sm text-gray-400">Submit a request to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeOffRequests.map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium capitalize">{request.type} Request</h4>
                                <Badge
                                  variant={
                                    request.status === "approved"
                                      ? "default"
                                      : request.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {new Date(request.start_date).toLocaleDateString()} -{" "}
                                {new Date(request.end_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-800">{request.reason}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Submitted: {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
