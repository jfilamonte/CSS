"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Calendar, Plus, Trash2, Settings } from "lucide-react"

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface DaySchedule {
  day: string
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface BusinessHours {
  [key: string]: DaySchedule
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export default function AvailabilityManager() {
  const [businessHours, setBusinessHours] = useState<BusinessHours>({})
  const [selectedDay, setSelectedDay] = useState<string>("monday")
  const [bufferTime, setBufferTime] = useState<number>(30) // minutes between appointments
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState<number>(60) // days
  const [minAdvanceBooking, setMinAdvanceBooking] = useState<number>(1) // days

  useEffect(() => {
    // Initialize default business hours
    const defaultHours: BusinessHours = {}
    DAYS_OF_WEEK.forEach((day) => {
      defaultHours[day] = {
        day,
        enabled: day !== "sunday", // Closed on Sundays by default
        timeSlots:
          day !== "sunday"
            ? [
                { start: "08:00", end: "12:00", available: true },
                { start: "13:00", end: "17:00", available: true },
              ]
            : [],
      }
    })
    setBusinessHours(defaultHours)
  }, [])

  const updateDayEnabled = (day: string, enabled: boolean) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        timeSlots:
          enabled && prev[day].timeSlots.length === 0
            ? [{ start: "08:00", end: "17:00", available: true }]
            : prev[day].timeSlots,
      },
    }))
  }

  const addTimeSlot = (day: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { start: "09:00", end: "17:00", available: true }],
      },
    }))
  }

  const updateTimeSlot = (
    day: string,
    index: number,
    field: "start" | "end" | "available",
    value: string | boolean,
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
      },
    }))
  }

  const removeTimeSlot = (day: string, index: number) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index),
      },
    }))
  }

  const copySchedule = (fromDay: string, toDay: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [toDay]: {
        ...prev[toDay],
        enabled: prev[fromDay].enabled,
        timeSlots: [...prev[fromDay].timeSlots],
      },
    }))
  }

  const generateAvailableSlots = (day: string, date: Date) => {
    const daySchedule = businessHours[day.toLowerCase()]
    if (!daySchedule?.enabled) return []

    const slots: string[] = []

    daySchedule.timeSlots.forEach((timeSlot) => {
      if (!timeSlot.available) return

      const startTime = new Date(`${date.toDateString()} ${timeSlot.start}`)
      const endTime = new Date(`${date.toDateString()} ${timeSlot.end}`)

      const currentTime = new Date(startTime)

      while (currentTime < endTime) {
        slots.push(currentTime.toTimeString().slice(0, 5))
        currentTime.setMinutes(currentTime.getMinutes() + bufferTime)
      }
    })

    return slots
  }

  const saveAvailability = async () => {
    try {
      // In real app, save to database
      console.log("Saving availability settings:", {
        businessHours,
        bufferTime,
        maxAdvanceBooking,
        minAdvanceBooking,
      })
      alert("Availability settings saved successfully!")
    } catch (error) {
      console.error("Error saving availability:", error)
      alert("Failed to save availability settings")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Availability Settings
          </CardTitle>
          <CardDescription>Configure your business hours and booking preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="buffer-time">Buffer Time (minutes)</Label>
              <Input
                id="buffer-time"
                type="number"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                min="15"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">Time between appointments</p>
            </div>
            <div>
              <Label htmlFor="min-advance">Min Advance Booking (days)</Label>
              <Input
                id="min-advance"
                type="number"
                value={minAdvanceBooking}
                onChange={(e) => setMinAdvanceBooking(Number(e.target.value))}
                min="0"
                max="30"
              />
            </div>
            <div>
              <Label htmlFor="max-advance">Max Advance Booking (days)</Label>
              <Input
                id="max-advance"
                type="number"
                value={maxAdvanceBooking}
                onChange={(e) => setMaxAdvanceBooking(Number(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </div>

          <Separator />

          {/* Day Selection */}
          <div>
            <Label>Select Day to Configure</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                  className="relative"
                >
                  {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                  {businessHours[day]?.enabled && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-green-500"></Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Day Configuration */}
          {selectedDay && businessHours[selectedDay] && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {DAY_LABELS[selectedDay as keyof typeof DAY_LABELS]} Schedule
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`${selectedDay}-enabled`}>Open</Label>
                    <Switch
                      id={`${selectedDay}-enabled`}
                      checked={businessHours[selectedDay].enabled}
                      onCheckedChange={(checked) => updateDayEnabled(selectedDay, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessHours[selectedDay].enabled ? (
                  <>
                    {/* Time Slots */}
                    <div className="space-y-3">
                      {businessHours[selectedDay].timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(selectedDay, index, "start", e.target.value)}
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(selectedDay, index, "end", e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`slot-${index}-available`}>Available</Label>
                            <Switch
                              id={`slot-${index}-available`}
                              checked={slot.available}
                              onCheckedChange={(checked) => updateTimeSlot(selectedDay, index, "available", checked)}
                            />
                          </div>
                          <Button variant="outline" size="sm" onClick={() => removeTimeSlot(selectedDay, index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" onClick={() => addTimeSlot(selectedDay)} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time Slot
                    </Button>

                    {/* Copy Schedule */}
                    <div className="flex items-center space-x-2">
                      <Label>Copy this schedule to:</Label>
                      <Select onValueChange={(day) => copySchedule(selectedDay, day)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.filter((day) => day !== selectedDay).map((day) => (
                            <SelectItem key={day} value={day}>
                              {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>This day is marked as closed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Available Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Available Slots</CardTitle>
              <CardDescription>See what time slots will be available for booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {DAYS_OF_WEEK.map((day) => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  const dayIndex = DAYS_OF_WEEK.indexOf(day)
                  const targetDate = new Date(tomorrow)
                  targetDate.setDate(tomorrow.getDate() + ((dayIndex - tomorrow.getDay() + 7) % 7))

                  const availableSlots = generateAvailableSlots(day, targetDate)

                  return (
                    <div key={day} className="text-center">
                      <h4 className="font-medium mb-2">{DAY_LABELS[day as keyof typeof DAY_LABELS]}</h4>
                      <div className="space-y-1">
                        {businessHours[day]?.enabled ? (
                          availableSlots.slice(0, 4).map((slot, index) => (
                            <Badge key={index} variant="outline" className="text-xs block">
                              {slot}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Closed
                          </Badge>
                        )}
                        {availableSlots.length > 4 && (
                          <p className="text-xs text-gray-500">+{availableSlots.length - 4} more</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveAvailability}>Save Availability Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
