"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SmartAppointmentBookingProps {
  customerId?: string
  quoteId?: string
  onAppointmentCreated?: (appointment: any) => void
}

export default function SmartAppointmentBooking({
  customerId,
  quoteId,
  onAppointmentCreated,
}: SmartAppointmentBookingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  })
  const [availableSlots, setAvailableSlots] = useState<
    Array<{
      time: string
      availableReps: number
      totalReps: number
    }>
  >([])
  const [optimalSalesRep, setOptimalSalesRep] = useState<any>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (!customerId) {
      fetchCustomers()
    }
  }, [customerId])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role", "customer")
        .order("first_name", { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchAvailableSlots = async (date: string) => {
    if (!date) return

    setLoadingSlots(true)
    try {
      const response = await fetch("/api/get-available-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error("Error fetching available slots:", error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const getOptimalSalesRep = async (date: string, time: string) => {
    if (!date || !time) return

    try {
      const response = await fetch("/api/get-optimal-sales-rep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      })

      if (response.ok) {
        const data = await response.json()
        setOptimalSalesRep(data.salesRep)
      }
    } catch (error) {
      console.error("Error getting optimal sales rep:", error)
    }
  }

  useEffect(() => {
    if (formData.preferredDate) {
      fetchAvailableSlots(formData.preferredDate)
    }
  }, [formData.preferredDate])

  useEffect(() => {
    if (formData.preferredDate && formData.preferredTime) {
      getOptimalSalesRep(formData.preferredDate, formData.preferredTime)
    }
  }, [formData.preferredDate, formData.preferredTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const appointmentData = {
        customer_id: customerId,
        quote_id: quoteId,
        appointment_type: formData.appointmentType,
        scheduled_date: formData.preferredDate,
        scheduled_time: formData.preferredTime,
        duration_minutes: 60,
        status: "scheduled",
        customer_notes: formData.notes,
        assigned_to: optimalSalesRep?.id || null,
        admin_notes: optimalSalesRep
          ? `Smart-assigned to ${optimalSalesRep.first_name} ${optimalSalesRep.last_name} (optimal workload)`
          : null,
      }

      const { data, error } = await supabase.from("appointments").insert(appointmentData).select().single()

      if (error) throw error

      if (onAppointmentCreated) {
        onAppointmentCreated(data)
      }

      setIsOpen(false)
      setFormData({
        appointmentType: "",
        preferredDate: "",
        preferredTime: "",
        notes: "",
      })
      setOptimalSalesRep(null)
      setAvailableSlots([])
    } catch (error) {
      console.error("Error creating appointment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Smart Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Smart Appointment Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!customerId && (
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="appointmentType">Appointment Type</Label>
            <Select
              value={formData.appointmentType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, appointmentType: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Initial Consultation</SelectItem>
                <SelectItem value="site-visit">Site Visit & Measurement</SelectItem>
                <SelectItem value="estimate-review">Estimate Review</SelectItem>
                <SelectItem value="project-planning">Project Planning</SelectItem>
                <SelectItem value="follow-up">Follow-up Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, preferredDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">
                Preferred Time
                {loadingSlots && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
              </Label>
              {availableSlots.length > 0 ? (
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredTime: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select available time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => {
                      const [hours, minutes] = slot.time.split(":")
                      const hour = Number.parseInt(hours)
                      const ampm = hour >= 12 ? "PM" : "AM"
                      const displayHour = hour % 12 || 12
                      const displayTime = `${displayHour}:${minutes} ${ampm}`

                      return (
                        <SelectItem key={slot.time} value={slot.time}>
                          <div className="flex items-center justify-between w-full">
                            <span>{displayTime}</span>
                            <Badge
                              variant={
                                slot.availableReps > 2
                                  ? "default"
                                  : slot.availableReps > 0
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs ml-2"
                            >
                              {slot.availableReps > 0 ? `${slot.availableReps} available` : "Fully booked"}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : formData.preferredDate ? (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-700">
                    {loadingSlots ? "Checking availability..." : "No available slots for this date."}
                  </span>
                </div>
              ) : (
                <Input placeholder="Select date first" disabled />
              )}
            </div>
          </div>

          {optimalSalesRep && formData.preferredTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">Smart Assignment</span>
              </div>
              <p className="text-sm text-green-700">
                This appointment will be optimally assigned to{" "}
                <span className="font-medium">
                  {optimalSalesRep.first_name} {optimalSalesRep.last_name}
                </span>
                {optimalSalesRep.thisWeekAppointments !== undefined && (
                  <span className="text-xs text-green-600 ml-1">
                    ({optimalSalesRep.thisWeekAppointments} appointments this week)
                  </span>
                )}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements or questions for the appointment..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.preferredTime}>
              {isSubmitting ? "Booking..." : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
