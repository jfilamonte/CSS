"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { blockSalesRepTime } from "@/lib/actions"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  appointment_address: string
  quotes?: {
    customer_name: string
    customer_email: string
    customer_phone: string
  }
}

interface BlockedTime {
  id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  reason: string
}

interface SalesRepCalendarProps {
  appointments?: Appointment[]
}

export default function SalesRepCalendar({ appointments: propAppointments }: SalesRepCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>(propAppointments || [])
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBlockTimeDialog, setShowBlockTimeDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (propAppointments) {
      setAppointments(propAppointments)
      loadBlockedTimes()
    } else {
      loadCalendarData()
    }
  }, [currentDate, propAppointments])

  async function loadBlockedTimes() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data: blockedTimesData } = await supabase
        .from("sales_rep_blocked_times")
        .select("*")
        .eq("sales_rep_id", user.id)
        .eq("is_active", true)
        .gte("start_date", startOfMonth.toISOString().split("T")[0])
        .lte("end_date", endOfMonth.toISOString().split("T")[0])

      setBlockedTimes(blockedTimesData || [])
    } catch (error) {
      console.error("Error loading blocked times:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadCalendarData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get start and end of current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      // Load appointments for current month
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
        .eq("assigned_to", user.id)
        .gte("appointment_date", startOfMonth.toISOString().split("T")[0])
        .lte("appointment_date", endOfMonth.toISOString().split("T")[0])
        .order("appointment_date", { ascending: true })

      // Load blocked times for current month
      const { data: blockedTimesData } = await supabase
        .from("sales_rep_blocked_times")
        .select("*")
        .eq("sales_rep_id", user.id)
        .eq("is_active", true)
        .gte("start_date", startOfMonth.toISOString().split("T")[0])
        .lte("end_date", endOfMonth.toISOString().split("T")[0])

      setAppointments(appointmentsData || [])
      setBlockedTimes(blockedTimesData || [])
    } catch (error) {
      console.error("Error loading calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBlockTime(formData: FormData) {
    const result = await blockSalesRepTime(formData)
    if (result.success) {
      setShowBlockTimeDialog(false)
      loadCalendarData()
    } else {
      console.error("Error blocking time:", result.error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.appointment_date === dateString)
  }

  const getBlockedTimesForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return blockedTimes.filter((blocked) => {
      const startDate = new Date(blocked.start_date)
      const endDate = new Date(blocked.end_date)
      return date >= startDate && date <= endDate
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {monthYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Dialog open={showBlockTimeDialog} onOpenChange={setShowBlockTimeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Block Time
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Block Time</DialogTitle>
                  </DialogHeader>
                  <form action={handleBlockTime} className="space-y-4">
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
                      <Textarea name="reason" placeholder="Meeting, personal appointment, etc." required />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-24"></div>
              }

              const dayAppointments = getAppointmentsForDate(day)
              const dayBlockedTimes = getBlockedTimesForDate(day)
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 h-24 border rounded-lg ${
                    isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                  } overflow-hidden`}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                    {day.getDate()}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs p-1 rounded bg-green-100 text-green-800 truncate"
                        title={`${apt.appointment_time} - ${apt.quotes?.customer_name}`}
                      >
                        {apt.appointment_time} - {apt.quotes?.customer_name}
                      </div>
                    ))}

                    {dayBlockedTimes.slice(0, 1).map((blocked) => (
                      <div
                        key={blocked.id}
                        className="text-xs p-1 rounded bg-red-100 text-red-800 truncate"
                        title={`${blocked.start_time}-${blocked.end_time}: ${blocked.reason}`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        Blocked
                      </div>
                    ))}

                    {dayAppointments.length + dayBlockedTimes.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length + dayBlockedTimes.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Business Hours Info */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Business Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600">Monday - Friday</h4>
              <p className="text-sm text-gray-600">7:00 AM - 8:00 PM</p>
              <p className="text-xs text-gray-500">Available for appointments</p>
            </div>
            <div>
              <h4 className="font-medium text-green-600">Saturday</h4>
              <p className="text-sm text-gray-600">9:00 AM - 12:00 PM</p>
              <p className="text-xs text-gray-500">Available for appointments</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Customers can book appointments during these hours unless you have blocked specific
              times. Use the "Block Time" button to mark periods when you're unavailable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
