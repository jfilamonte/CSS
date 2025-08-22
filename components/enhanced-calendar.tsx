"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Trash2, Plus, User, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Appointment {
  id: string
  customer_id: string
  customer_name?: string
  appointment_type: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: string
  customer_notes?: string
  admin_notes?: string
  assigned_to?: string
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
}

interface EnhancedCalendarProps {
  appointments: Appointment[]
  customers: any[]
  onAppointmentUpdate: (appointment: Appointment) => void
  onAppointmentDelete: (appointmentId: string) => void
  onAppointmentCreate: (appointment: any) => void
}

export default function EnhancedCalendar({
  appointments,
  customers,
  onAppointmentUpdate,
  onAppointmentDelete,
  onAppointmentCreate,
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("")
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchSalesReps()
  }, [])

  const fetchSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, is_active")
        .eq("role", "sales_person")
        .eq("is_active", true)
        .order("first_name", { ascending: true })

      if (error) throw error
      setSalesReps(data || [])
    } catch (error) {
      console.error("Error fetching sales reps:", error)
    }
  }

  const getAvailableTimeSlots = async (date: string, salesRepId?: string) => {
    if (!date) return

    setLoadingAvailability(true)
    try {
      const dayOfWeek = new Date(date).getDay()

      // Get sales rep availability for the day
      let availabilityQuery = supabase
        .from("sales_rep_availability")
        .select(`
          *,
          users!sales_rep_availability_sales_rep_id_fkey(first_name, last_name)
        `)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)

      if (salesRepId) {
        availabilityQuery = availabilityQuery.eq("sales_rep_id", salesRepId)
      }

      const { data: availability, error: availError } = await availabilityQuery

      if (availError) throw availError

      // Get blocked times for the date
      let blockedQuery = supabase.from("sales_rep_blocked_times").select("*").eq("blocked_date", date)

      if (salesRepId) {
        blockedQuery = blockedQuery.eq("sales_rep_id", salesRepId)
      }

      const { data: blockedTimes, error: blockedError } = await blockedQuery

      if (blockedError) throw blockedError

      // Get existing appointments for the date
      let appointmentsQuery = supabase
        .from("appointments")
        .select("scheduled_time, duration_minutes, assigned_to")
        .eq("scheduled_date", date)
        .neq("status", "cancelled")

      if (salesRepId) {
        appointmentsQuery = appointmentsQuery.eq("assigned_to", salesRepId)
      }

      const { data: existingAppointments, error: aptError } = await appointmentsQuery

      if (aptError) throw aptError

      // Generate available time slots
      const slots: string[] = []
      const slotDuration = 30 // 30-minute slots

      availability?.forEach((avail: any) => {
        const startTime = new Date(`${date} ${avail.start_time}`)
        const endTime = new Date(`${date} ${avail.end_time}`)

        const current = new Date(startTime)

        while (current < endTime) {
          const timeString = current.toTimeString().slice(0, 5)

          // Check if this slot is blocked
          const isBlocked = blockedTimes?.some((blocked: any) => {
            if (blocked.is_all_day) return true
            return blocked.start_time <= timeString && blocked.end_time > timeString
          })

          // Check if this slot conflicts with existing appointments
          const hasConflict = existingAppointments?.some((apt: any) => {
            const aptStart = new Date(`${date} ${apt.scheduled_time}`)
            const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000)
            const slotEnd = new Date(current.getTime() + slotDuration * 60000)

            return (current >= aptStart && current < aptEnd) || (slotEnd > aptStart && slotEnd <= aptEnd)
          })

          if (!isBlocked && !hasConflict) {
            slots.push(timeString)
          }

          current.setMinutes(current.getMinutes() + slotDuration)
        }
      })

      setAvailableTimeSlots(slots.sort())
    } catch (error) {
      console.error("Error getting available time slots:", error)
      setAvailableTimeSlots([])
    } finally {
      setLoadingAvailability(false)
    }
  }

  const getAvailableSalesRep = async (date: string, time: string) => {
    try {
      const dayOfWeek = new Date(date).getDay()

      const { data: availableReps, error } = await supabase
        .from("sales_rep_availability")
        .select(`
          sales_rep_id,
          users!sales_rep_availability_sales_rep_id_fkey(id, first_name, last_name, is_active)
        `)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .lte("start_time", time)
        .gte("end_time", time)

      if (error) throw error

      // Filter out blocked reps
      const { data: blockedReps, error: blockedError } = await supabase
        .from("sales_rep_blocked_times")
        .select("sales_rep_id")
        .eq("blocked_date", date)
        .or(`is_all_day.eq.true,and(start_time.lte.${time},end_time.gt.${time})`)

      if (blockedError) throw blockedError

      const blockedRepIds = blockedReps?.map((b) => b.sales_rep_id) || []

      const availableRepIds =
        availableReps
          ?.filter((rep) => rep.users?.is_active && !blockedRepIds.includes(rep.sales_rep_id))
          .map((rep) => rep.sales_rep_id) || []

      // Return the first available rep (could be enhanced with load balancing)
      return availableRepIds[0] || null
    } catch (error) {
      console.error("Error getting available sales rep:", error)
      return null
    }
  }

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.scheduled_date === dateStr)
  }

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // Get color for appointment type
  const getAppointmentColor = (type: string, status: string) => {
    if (status === "cancelled") return "bg-red-100 text-red-800 border-red-200"
    if (status === "completed") return "bg-green-100 text-green-800 border-green-200"

    switch (type) {
      case "consultation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "estimate":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "follow-up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "project-start":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Navigate calendar
  const navigateCalendar = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Handle appointment edit
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setSelectedSalesRep(appointment.assigned_to || "")
    if (appointment.scheduled_date) {
      getAvailableTimeSlots(appointment.scheduled_date, appointment.assigned_to)
    }
    setShowEditModal(true)
  }

  // Handle appointment creation
  const handleCreateAppointment = (date?: string) => {
    setSelectedDate(date || "")
    setSelectedSalesRep("")
    setAvailableTimeSlots([])
    if (date) {
      getAvailableTimeSlots(date)
    }
    setShowCreateModal(true)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => navigateCalendar("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateCalendar("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "month" | "week" | "day") => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => handleCreateAppointment()}>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "month" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-0 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center font-medium text-gray-500 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {generateCalendarDays().map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day)
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = day.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-32 p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                    } ${isToday ? "bg-blue-50" : ""}`}
                    onClick={() => handleCreateAppointment(day.toISOString().split("T")[0])}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>{day.getDate()}</div>

                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => {
                        const customer = customers.find((c) => c.id === appointment.customer_id)
                        const assignedRep = salesReps.find((rep) => rep.id === appointment.assigned_to)
                        return (
                          <div
                            key={appointment.id}
                            className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm ${getAppointmentColor(appointment.appointment_type, appointment.status)}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditAppointment(appointment)
                            }}
                          >
                            <div className="font-medium truncate">
                              {appointment.scheduled_time} - {customer?.first_name} {customer?.last_name}
                            </div>
                            <div className="truncate opacity-75">{appointment.appointment_type}</div>
                            {assignedRep && (
                              <div className="flex items-center text-xs opacity-60 mt-1">
                                <User className="w-3 h-3 mr-1" />
                                {assignedRep.first_name} {assignedRep.last_name}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">+{dayAppointments.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week/Day View */}
      {(viewMode === "week" || viewMode === "day") && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-gray-500 py-8">Week and Day views coming soon...</div>
          </CardContent>
        </Card>
      )}

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)

                let assignedTo = formData.get("assigned_to") as string
                if (!assignedTo || assignedTo === "auto") {
                  const date = formData.get("scheduled_date") as string
                  const time = formData.get("scheduled_time") as string
                  assignedTo = (await getAvailableSalesRep(date, time)) || ""
                }

                const updatedAppointment = {
                  ...selectedAppointment,
                  customer_id: formData.get("customer_id") as string,
                  appointment_type: formData.get("appointment_type") as string,
                  scheduled_date: formData.get("scheduled_date") as string,
                  scheduled_time: formData.get("scheduled_time") as string,
                  duration_minutes: Number.parseInt(formData.get("duration_minutes") as string),
                  status: formData.get("status") as string,
                  customer_notes: formData.get("customer_notes") as string,
                  admin_notes: formData.get("admin_notes") as string,
                  assigned_to: assignedTo,
                }
                onAppointmentUpdate(updatedAppointment)
                setShowEditModal(false)
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select name="customer_id" defaultValue={selectedAppointment.customer_id}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="appointment_type">Type</Label>
                  <Select name="appointment_type" defaultValue={selectedAppointment.appointment_type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="estimate">Estimate</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="project-start">Project Start</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Input
                    name="scheduled_date"
                    type="date"
                    defaultValue={selectedAppointment.scheduled_date}
                    onChange={(e) => {
                      const date = e.target.value
                      if (date) {
                        getAvailableTimeSlots(date, selectedSalesRep)
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Time</Label>
                  {availableTimeSlots.length > 0 ? (
                    <Select name="scheduled_time" defaultValue={selectedAppointment.scheduled_time}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input name="scheduled_time" type="time" defaultValue={selectedAppointment.scheduled_time} />
                  )}
                  {loadingAvailability && <p className="text-xs text-gray-500 mt-1">Loading available times...</p>}
                </div>
                <div>
                  <Label htmlFor="duration_minutes">Duration (min)</Label>
                  <Input name="duration_minutes" type="number" defaultValue={selectedAppointment.duration_minutes} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assigned_to">Assigned Sales Rep</Label>
                  <Select
                    name="assigned_to"
                    value={selectedSalesRep}
                    onValueChange={(value) => {
                      setSelectedSalesRep(value)
                      if (selectedAppointment.scheduled_date) {
                        getAvailableTimeSlots(selectedAppointment.scheduled_date, value === "auto" ? undefined : value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-assign based on availability</SelectItem>
                      {salesReps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.first_name} {rep.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={selectedAppointment.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="customer_notes">Customer Notes</Label>
                <Textarea name="customer_notes" defaultValue={selectedAppointment.customer_notes || ""} />
              </div>

              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea name="admin_notes" defaultValue={selectedAppointment.admin_notes || ""} />
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onAppointmentDelete(selectedAppointment.id)
                    setShowEditModal(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)

              let assignedTo = formData.get("assigned_to") as string
              if (!assignedTo || assignedTo === "auto") {
                const date = formData.get("scheduled_date") as string
                const time = formData.get("scheduled_time") as string
                assignedTo = (await getAvailableSalesRep(date, time)) || ""
              }

              const newAppointment = {
                customer_id: formData.get("customer_id") as string,
                appointment_type: formData.get("appointment_type") as string,
                scheduled_date: formData.get("scheduled_date") as string,
                scheduled_time: formData.get("scheduled_time") as string,
                duration_minutes: Number.parseInt(formData.get("duration_minutes") as string),
                customer_notes: formData.get("customer_notes") as string,
                admin_notes: formData.get("admin_notes") as string,
                assigned_to: assignedTo,
              }
              onAppointmentCreate(newAppointment)
              setShowCreateModal(false)
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select name="customer_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="appointment_type">Type</Label>
                <Select name="appointment_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="project-start">Project Start</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Date</Label>
                <Input
                  name="scheduled_date"
                  type="date"
                  defaultValue={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  onChange={(e) => {
                    const date = e.target.value
                    if (date) {
                      getAvailableTimeSlots(date, selectedSalesRep === "auto" ? undefined : selectedSalesRep)
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="scheduled_time">Time</Label>
                {availableTimeSlots.length > 0 ? (
                  <Select name="scheduled_time" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {slot}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input name="scheduled_time" type="time" required />
                )}
                {loadingAvailability && <p className="text-xs text-gray-500 mt-1">Loading available times...</p>}
                {availableTimeSlots.length === 0 && !loadingAvailability && selectedDate && (
                  <p className="text-xs text-orange-600 mt-1">
                    No available slots found. Please select a different date or time.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duration (min)</Label>
                <Input name="duration_minutes" type="number" defaultValue="60" />
              </div>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned Sales Rep</Label>
              <Select
                name="assigned_to"
                value={selectedSalesRep}
                onValueChange={(value) => {
                  setSelectedSalesRep(value)
                  if (selectedDate) {
                    getAvailableTimeSlots(selectedDate, value === "auto" ? undefined : value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-assign based on availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Auto-assign based on availability
                    </div>
                  </SelectItem>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {rep.first_name} {rep.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customer_notes">Customer Notes</Label>
              <Textarea name="customer_notes" />
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea name="admin_notes" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule Appointment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
