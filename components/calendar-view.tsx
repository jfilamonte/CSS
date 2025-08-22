"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Phone, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createAppointment } from "@/lib/database-actions"

interface Appointment {
  id: string
  customer_id: string
  quote_id?: string
  appointment_type: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: string
  customer_notes?: string
  admin_notes?: string
  created_at: string
  customer?: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = [
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

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const [appointmentsResult, customersResult] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            *,
            customer:users!appointments_customer_id_fkey(first_name, last_name, email, phone)
          `)
          .gte("scheduled_date", startOfMonth.toISOString().split("T")[0])
          .lte("scheduled_date", endOfMonth.toISOString().split("T")[0])
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("users")
          .select("id, first_name, last_name, email, phone")
          .eq("role", "customer")
          .order("first_name", { ascending: true }),
      ])

      if (appointmentsResult.data) {
        setAppointments(
          appointmentsResult.data.map((apt) => ({
            ...apt,
            customer: Array.isArray(apt.customer) ? apt.customer[0] : apt.customer,
          })),
        )
      }
      if (customersResult.data) setCustomers(customersResult.data)
    } catch (error) {
      console.error("Error fetching calendar data:", error)
    } finally {
      setLoading(false)
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

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = date.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.scheduled_date === dateString)
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

  const handleCreateAppointment = async (formData: FormData) => {
    try {
      const result = await createAppointment(formData)
      if (result.success) {
        setShowNewAppointmentModal(false)
        fetchData() // Refresh calendar data
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
      alert("Failed to create appointment")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500"
      case "confirmed":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={view} onValueChange={(value: "month" | "week" | "day") => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showNewAppointmentModal} onOpenChange={setShowNewAppointmentModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>Create a new customer appointment</DialogDescription>
              </DialogHeader>
              <form action={handleCreateAppointment} className="space-y-4">
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
                    <Label htmlFor="appointment_type">Appointment Type</Label>
                    <Select name="appointment_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="estimate">On-site Estimate</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="project-start">Project Start</SelectItem>
                        <SelectItem value="inspection">Final Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">Date</Label>
                    <Input
                      id="scheduled_date"
                      name="scheduled_date"
                      type="date"
                      defaultValue={selectedDate?.toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduled_time">Time</Label>
                    <Input id="scheduled_time" name="scheduled_time" type="time" required />
                  </div>
                  <div>
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Select name="duration_minutes" defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_notes">Customer Notes</Label>
                  <Textarea
                    id="customer_notes"
                    name="customer_notes"
                    placeholder="Any special requests or notes from customer"
                  />
                </div>
                <div>
                  <Label htmlFor="admin_notes">Admin Notes</Label>
                  <Textarea id="admin_notes" name="admin_notes" placeholder="Internal notes for the team" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewAppointmentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule Appointment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "month" && (
        <Card>
          <CardContent className="p-0">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date)
                const isToday = date && date.toDateString() === new Date().toDateString()
                const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                      isToday ? "bg-blue-50" : ""
                    } ${isSelected ? "bg-blue-100" : ""}`}
                    onClick={() => {
                      if (date) {
                        setSelectedDate(date)
                        setShowNewAppointmentModal(true)
                      }
                    }}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((appointment) => (
                            <div
                              key={appointment.id}
                              className={`text-xs p-1 rounded text-white truncate ${getStatusColor(appointment.status)}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAppointment(appointment)
                              }}
                            >
                              {formatTime(appointment.scheduled_time)} - {appointment.appointment_type}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Next 7 days of scheduled appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments
              .filter((apt) => {
                const aptDate = new Date(apt.scheduled_date)
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                return aptDate >= today && aptDate <= nextWeek
              })
              .slice(0, 5)
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status)}`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{new Date(appointment.scheduled_date).toLocaleDateString()}</span>
                        <Clock className="w-4 h-4 text-gray-400 ml-2" />
                        <span>{formatTime(appointment.scheduled_time)}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>
                            {appointment.customer?.first_name} {appointment.customer?.last_name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {appointment.appointment_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                {selectedAppointment.appointment_type} -{" "}
                {new Date(selectedAppointment.scheduled_date).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">
                    {selectedAppointment.customer?.first_name} {selectedAppointment.customer?.last_name}
                  </p>
                </div>
                <div>
                  <Label>Contact</Label>
                  <div className="space-y-1">
                    <p className="text-sm">{selectedAppointment.customer?.email}</p>
                    <p className="text-sm">{selectedAppointment.customer?.phone}</p>
                  </div>
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <p className="font-medium">
                    {new Date(selectedAppointment.scheduled_date).toLocaleDateString()} at{" "}
                    {formatTime(selectedAppointment.scheduled_time)}
                  </p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="font-medium">{selectedAppointment.duration_minutes} minutes</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>{selectedAppointment.status}</Badge>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="font-medium">{selectedAppointment.appointment_type}</p>
                </div>
              </div>

              {selectedAppointment.customer_notes && (
                <div>
                  <Label>Customer Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedAppointment.customer_notes}</p>
                </div>
              )}

              {selectedAppointment.admin_notes && (
                <div>
                  <Label>Admin Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedAppointment.admin_notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Reschedule</Button>
                <Button variant="outline">Mark Complete</Button>
                <Button>Edit Appointment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
