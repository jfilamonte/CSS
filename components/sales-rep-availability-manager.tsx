"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Clock, Calendar, Plus, Trash2, Save, RotateCcw, User, Ban, AlertCircle, Eye, EyeOff } from "lucide-react"

interface SalesRep {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: boolean
}

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface BlockedTime {
  id: string
  blocked_date: string
  start_time: string | null
  end_time: string | null
  reason: string
  is_all_day: boolean
}

interface SalesRepAvailabilityManagerProps {
  salesReps: SalesRep[]
  onClose: () => void
}

const DAYS_OF_WEEK = [
  { key: "sunday", label: "Sunday", index: 0, short: "Sun" },
  { key: "monday", label: "Monday", index: 1, short: "Mon" },
  { key: "tuesday", label: "Tuesday", index: 2, short: "Tue" },
  { key: "wednesday", label: "Wednesday", index: 3, short: "Wed" },
  { key: "thursday", label: "Thursday", index: 4, short: "Thu" },
  { key: "friday", label: "Friday", index: 5, short: "Fri" },
  { key: "saturday", label: "Saturday", index: 6, short: "Sat" },
]

const PRESET_SCHEDULES = {
  standard: {
    name: "Standard Business Hours",
    description: "Mon-Fri 8AM-6PM, Sat 9AM-1PM",
    schedule: {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "18:00" },
      saturday: { enabled: true, start: "09:00", end: "13:00" },
      sunday: { enabled: false, start: "10:00", end: "16:00" },
    },
  },
  extended: {
    name: "Extended Hours",
    description: "Mon-Fri 7AM-8PM, Sat 9AM-5PM",
    schedule: {
      monday: { enabled: true, start: "07:00", end: "20:00" },
      tuesday: { enabled: true, start: "07:00", end: "20:00" },
      wednesday: { enabled: true, start: "07:00", end: "20:00" },
      thursday: { enabled: true, start: "07:00", end: "20:00" },
      friday: { enabled: true, start: "07:00", end: "20:00" },
      saturday: { enabled: true, start: "09:00", end: "17:00" },
      sunday: { enabled: false, start: "10:00", end: "16:00" },
    },
  },
  partTime: {
    name: "Part-Time",
    description: "Mon/Wed/Fri 9AM-3PM",
    schedule: {
      monday: { enabled: true, start: "09:00", end: "15:00" },
      tuesday: { enabled: false, start: "09:00", end: "15:00" },
      wednesday: { enabled: true, start: "09:00", end: "15:00" },
      thursday: { enabled: false, start: "09:00", end: "15:00" },
      friday: { enabled: true, start: "09:00", end: "15:00" },
      saturday: { enabled: false, start: "09:00", end: "15:00" },
      sunday: { enabled: false, start: "09:00", end: "15:00" },
    },
  },
}

export default function SalesRepAvailabilityManager({ salesReps, onClose }: SalesRepAvailabilityManagerProps) {
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null)
  const [availability, setAvailability] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({})
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBlockedTimeForm, setShowBlockedTimeForm] = useState(false)
  const [viewMode, setViewMode] = useState<"schedule" | "blocked">("schedule")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const supabase = createClient()

  // Initialize default availability
  useEffect(() => {
    const defaultAvailability = DAYS_OF_WEEK.reduce(
      (acc, day) => {
        acc[day.key] = { enabled: false, start: "09:00", end: "17:00" }
        return acc
      },
      {} as Record<string, { enabled: boolean; start: string; end: string }>,
    )
    setAvailability(defaultAvailability)
  }, [])

  const loadRepData = async (rep: SalesRep) => {
    setLoading(true)
    try {
      const [availabilityResult, blockedTimesResult] = await Promise.all([
        supabase.from("sales_rep_availability").select("*").eq("sales_rep_id", rep.id),
        supabase
          .from("sales_rep_blocked_times")
          .select("*")
          .eq("sales_rep_id", rep.id)
          .gte("blocked_date", new Date().toISOString().split("T")[0])
          .order("blocked_date", { ascending: true }),
      ])

      // Process availability data
      const availabilityData = DAYS_OF_WEEK.reduce(
        (acc, day) => {
          const dayData = availabilityResult.data?.find((item) => item.day_of_week === day.index)
          acc[day.key] = dayData
            ? { enabled: true, start: dayData.start_time, end: dayData.end_time }
            : { enabled: false, start: "09:00", end: "17:00" }
          return acc
        },
        {} as Record<string, { enabled: boolean; start: string; end: string }>,
      )

      setAvailability(availabilityData)
      setBlockedTimes(blockedTimesResult.data || [])
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error loading rep data:", error)
      toast.error("Failed to load availability data")
    } finally {
      setLoading(false)
    }
  }

  const handleRepSelect = (rep: SalesRep) => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to switch representatives?")) {
        return
      }
    }
    setSelectedRep(rep)
    loadRepData(rep)
    setViewMode("schedule")
  }

  const handleAvailabilityChange = (day: string, field: "enabled" | "start" | "end", value: boolean | string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
    setHasUnsavedChanges(true)
  }

  const applyPreset = (presetKey: keyof typeof PRESET_SCHEDULES) => {
    const preset = PRESET_SCHEDULES[presetKey]
    setAvailability(preset.schedule)
    setHasUnsavedChanges(true)
    toast.success(`Applied ${preset.name} schedule`)
  }

  const copyFromAnotherRep = async (sourceRepId: string) => {
    try {
      const { data } = await supabase.from("sales_rep_availability").select("*").eq("sales_rep_id", sourceRepId)

      if (data && data.length > 0) {
        const copiedAvailability = DAYS_OF_WEEK.reduce(
          (acc, day) => {
            const dayData = data.find((item) => item.day_of_week === day.index)
            acc[day.key] = dayData
              ? { enabled: true, start: dayData.start_time, end: dayData.end_time }
              : { enabled: false, start: "09:00", end: "17:00" }
            return acc
          },
          {} as Record<string, { enabled: boolean; start: string; end: string }>,
        )

        setAvailability(copiedAvailability)
        setHasUnsavedChanges(true)
        toast.success("Schedule copied successfully")
      } else {
        toast.error("No schedule found for selected representative")
      }
    } catch (error) {
      toast.error("Failed to copy schedule")
    }
  }

  const saveAvailability = async () => {
    if (!selectedRep) return

    setSaving(true)
    try {
      // Delete existing availability
      await supabase.from("sales_rep_availability").delete().eq("sales_rep_id", selectedRep.id)

      // Insert new availability
      const availabilityData = DAYS_OF_WEEK.filter((day) => availability[day.key].enabled).map((day) => ({
        sales_rep_id: selectedRep.id,
        day_of_week: day.index,
        start_time: availability[day.key].start,
        end_time: availability[day.key].end,
        is_active: true,
      }))

      if (availabilityData.length > 0) {
        const { error } = await supabase.from("sales_rep_availability").insert(availabilityData)
        if (error) throw error
      }

      setHasUnsavedChanges(false)
      toast.success("Schedule saved successfully")
    } catch (error) {
      console.error("Error saving availability:", error)
      toast.error("Failed to save schedule")
    } finally {
      setSaving(false)
    }
  }

  const addBlockedTime = async (formData: FormData) => {
    if (!selectedRep) return

    try {
      const blockedTimeData = {
        sales_rep_id: selectedRep.id,
        blocked_date: formData.get("blocked_date") as string,
        start_time: (formData.get("start_time") as string) || null,
        end_time: (formData.get("end_time") as string) || null,
        reason: formData.get("reason") as string,
        is_all_day: formData.get("is_all_day") === "on",
      }

      const { data, error } = await supabase.from("sales_rep_blocked_times").insert([blockedTimeData]).select().single()
      if (error) throw error

      setBlockedTimes((prev) =>
        [...prev, data].sort((a, b) => new Date(a.blocked_date).getTime() - new Date(b.blocked_date).getTime()),
      )
      setShowBlockedTimeForm(false)
      toast.success("Blocked time added successfully")
    } catch (error) {
      console.error("Error adding blocked time:", error)
      toast.error("Failed to add blocked time")
    }
  }

  const removeBlockedTime = async (id: string) => {
    try {
      await supabase.from("sales_rep_blocked_times").delete().eq("id", id)
      setBlockedTimes((prev) => prev.filter((bt) => bt.id !== id))
      toast.success("Blocked time removed")
    } catch (error) {
      toast.error("Failed to remove blocked time")
    }
  }

  const calculateWeeklyHours = () => {
    return DAYS_OF_WEEK.reduce((total, day) => {
      if (!availability[day.key].enabled) return total
      const start = availability[day.key].start.split(":").map(Number)
      const end = availability[day.key].end.split(":").map(Number)
      const hours = end[0] + end[1] / 60 - (start[0] + start[1] / 60)
      return total + Math.max(0, hours)
    }, 0)
  }

  const getScheduleSummary = () => {
    const enabledDays = DAYS_OF_WEEK.filter((day) => availability[day.key].enabled)
    const weekdays = enabledDays.filter((day) => day.index >= 1 && day.index <= 5)
    const weekends = enabledDays.filter((day) => day.index === 0 || day.index === 6)

    return {
      totalDays: enabledDays.length,
      weekdays: weekdays.length,
      weekends: weekends.length,
      totalHours: calculateWeeklyHours(),
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <User className="w-6 h-6 mr-3 text-blue-600" />
            Sales Team Availability Management
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Manage weekly schedules and blocked times for your sales representatives
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Sales Rep Selector */}
          <div className="w-80 flex-shrink-0 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Representative</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {salesReps.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => handleRepSelect(rep)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedRep?.id === rep.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {rep.first_name} {rep.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{rep.email}</p>
                      </div>
                      <Badge variant={rep.is_active ? "default" : "secondary"}>
                        {rep.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedRep && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const summary = getScheduleSummary()
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Working Days:</span>
                          <span className="font-medium">{summary.totalDays}/7</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Weekly Hours:</span>
                          <span className="font-medium">{summary.totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Blocked Times:</span>
                          <span className="font-medium">{blockedTimes.length}</span>
                        </div>
                        {hasUnsavedChanges && (
                          <div className="flex items-center text-orange-600 text-sm">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Unsaved changes
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {!selectedRep ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Sales Representative</h3>
                  <p className="text-gray-600">Choose a team member from the list to manage their availability</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* View Mode Tabs */}
                <div className="flex-shrink-0 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("schedule")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          viewMode === "schedule"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-2 inline" />
                        Weekly Schedule
                      </button>
                      <button
                        onClick={() => setViewMode("blocked")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          viewMode === "blocked"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Ban className="w-4 h-4 mr-2 inline" />
                        Blocked Times ({blockedTimes.length})
                      </button>
                    </div>

                    {viewMode === "schedule" && (
                      <div className="flex items-center space-x-2">
                        {hasUnsavedChanges && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadRepData(selectedRep)}
                            className="text-gray-600"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        )}
                        <Button
                          onClick={saveAvailability}
                          disabled={saving || !hasUnsavedChanges}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Schedule
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                  {viewMode === "schedule" ? (
                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-blue-900">Quick Setup</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(PRESET_SCHEDULES).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => applyPreset(key as keyof typeof PRESET_SCHEDULES)}
                                className="p-4 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors text-left"
                              >
                                <h4 className="font-medium text-blue-900">{preset.name}</h4>
                                <p className="text-sm text-blue-700 mt-1">{preset.description}</p>
                              </button>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <Label className="text-sm font-medium text-blue-900">Copy from another rep:</Label>
                            <Select onValueChange={copyFromAnotherRep}>
                              <SelectTrigger className="mt-1 bg-white">
                                <SelectValue placeholder="Select representative to copy from" />
                              </SelectTrigger>
                              <SelectContent>
                                {salesReps
                                  .filter((rep) => rep.id !== selectedRep.id)
                                  .map((rep) => (
                                    <SelectItem key={rep.id} value={rep.id}>
                                      {rep.first_name} {rep.last_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weekly Schedule */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl">
                            Weekly Schedule - {selectedRep.first_name} {selectedRep.last_name}
                          </CardTitle>
                          <CardDescription>Set working hours for each day of the week</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {DAYS_OF_WEEK.map((day) => {
                                const dayData = availability[day.key]
                                const isWeekend = day.index === 0 || day.index === 6

                                return (
                                  <div
                                    key={day.key}
                                    className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                                      dayData.enabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 w-32">
                                      <input
                                        type="checkbox"
                                        checked={dayData.enabled}
                                        onChange={(e) => handleAvailabilityChange(day.key, "enabled", e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <div>
                                        <Label
                                          className={`font-medium cursor-pointer ${
                                            isWeekend ? "text-orange-700" : "text-gray-900"
                                          }`}
                                        >
                                          {day.label}
                                        </Label>
                                        {isWeekend && <p className="text-xs text-orange-600">Weekend</p>}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-4 flex-1">
                                      <div className="flex items-center space-x-2">
                                        <Label className="text-sm font-medium text-gray-700 w-12">From:</Label>
                                        <Input
                                          type="time"
                                          value={dayData.start}
                                          onChange={(e) => handleAvailabilityChange(day.key, "start", e.target.value)}
                                          disabled={!dayData.enabled}
                                          className="w-32"
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Label className="text-sm font-medium text-gray-700 w-8">To:</Label>
                                        <Input
                                          type="time"
                                          value={dayData.end}
                                          onChange={(e) => handleAvailabilityChange(day.key, "end", e.target.value)}
                                          disabled={!dayData.enabled}
                                          className="w-32"
                                        />
                                      </div>

                                      <div className="text-sm text-gray-600 w-16 text-right">
                                        {dayData.enabled ? (
                                          (() => {
                                            const start = dayData.start.split(":").map(Number)
                                            const end = dayData.end.split(":").map(Number)
                                            const hours = end[0] + end[1] / 60 - (start[0] + start[1] / 60)
                                            return `${Math.max(0, hours).toFixed(1)}h`
                                          })()
                                        ) : (
                                          <span className="text-gray-400">Off</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Add Blocked Time */}
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-orange-900 flex items-center">
                              <Plus className="w-5 h-5 mr-2" />
                              Add Blocked Time
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowBlockedTimeForm(!showBlockedTimeForm)}
                              className="text-orange-700 border-orange-300 hover:bg-orange-100"
                            >
                              {showBlockedTimeForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardHeader>
                        {showBlockedTimeForm && (
                          <CardContent>
                            <form action={addBlockedTime} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="blocked_date">Date *</Label>
                                  <Input
                                    type="date"
                                    id="blocked_date"
                                    name="blocked_date"
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                    className="mt-1 bg-white"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="reason">Reason *</Label>
                                  <Select name="reason" required>
                                    <SelectTrigger className="mt-1 bg-white">
                                      <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="vacation">Vacation</SelectItem>
                                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                      <SelectItem value="personal">Personal Time</SelectItem>
                                      <SelectItem value="meeting">Meeting</SelectItem>
                                      <SelectItem value="training">Training</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id="is_all_day"
                                    name="is_all_day"
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                  />
                                  <Label htmlFor="is_all_day">All Day</Label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="start_time">Start Time</Label>
                                    <Input type="time" id="start_time" name="start_time" className="mt-1 bg-white" />
                                  </div>
                                  <div>
                                    <Label htmlFor="end_time">End Time</Label>
                                    <Input type="time" id="end_time" name="end_time" className="mt-1 bg-white" />
                                  </div>
                                </div>
                              </div>

                              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Blocked Time
                              </Button>
                            </form>
                          </CardContent>
                        )}
                      </Card>

                      {/* Blocked Times List */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Upcoming Blocked Times
                            {blockedTimes.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {blockedTimes.length}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {blockedTimes.length === 0 ? (
                            <div className="text-center py-12">
                              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blocked Times</h3>
                              <p className="text-gray-600">Add blocked times above to manage unavailable periods</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {blockedTimes.map((blocked) => (
                                <div
                                  key={blocked.id}
                                  className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <Badge
                                      className={`capitalize ${
                                        blocked.reason === "vacation"
                                          ? "bg-blue-100 text-blue-800"
                                          : blocked.reason === "sick_leave"
                                            ? "bg-red-100 text-red-800"
                                            : blocked.reason === "meeting"
                                              ? "bg-purple-100 text-purple-800"
                                              : blocked.reason === "training"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {blocked.reason.replace("_", " ")}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeBlockedTime(blocked.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <p className="font-medium text-gray-900">
                                      {new Date(blocked.blocked_date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {blocked.is_all_day ? "All Day" : `${blocked.start_time} - ${blocked.end_time}`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
