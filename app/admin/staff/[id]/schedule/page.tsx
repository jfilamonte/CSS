"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  department: string
}

interface Schedule {
  id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  shift_type: string
  status: string
  notes?: string
  created_at: string
}

export default function StaffSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    shift_type: "regular",
    status: "scheduled",
    notes: "",
  })

  useEffect(() => {
    loadStaffAndSchedules()
  }, [staffId])

  const loadStaffAndSchedules = async () => {
    try {
      setLoading(true)

      // Load staff member details
      const staffResponse = await fetch(`/api/admin/staff/${staffId}`)
      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        setStaff(staffData)
      }

      // Load schedules
      const schedulesResponse = await fetch(`/api/admin/staff/${staffId}/schedule`)
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData)
      }
    } catch (err) {
      setError("Failed to load staff schedule data")
      console.error("Error loading staff schedule:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    try {
      const url = editingSchedule
        ? `/api/admin/staff/${staffId}/schedule/${editingSchedule.id}`
        : `/api/admin/staff/${staffId}/schedule`

      const method = editingSchedule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadStaffAndSchedules()
        setIsAddDialogOpen(false)
        setEditingSchedule(null)
        setFormData({
          date: "",
          start_time: "",
          end_time: "",
          shift_type: "regular",
          status: "scheduled",
          notes: "",
        })
      } else {
        setError("Failed to save schedule")
      }
    } catch (err) {
      setError("Failed to save schedule")
      console.error("Error saving schedule:", err)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule entry?")) return

    try {
      const response = await fetch(`/api/admin/staff/${staffId}/schedule/${scheduleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadStaffAndSchedules()
      } else {
        setError("Failed to delete schedule")
      }
    } catch (err) {
      setError("Failed to delete schedule")
      console.error("Error deleting schedule:", err)
    }
  }

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      shift_type: schedule.shift_type,
      status: schedule.status,
      notes: schedule.notes || "",
    })
    setIsAddDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case "regular":
        return "bg-blue-100 text-blue-800"
      case "overtime":
        return "bg-purple-100 text-purple-800"
      case "holiday":
        return "bg-green-100 text-green-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading staff schedule...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Staff Schedule</h1>
            {staff && (
              <p className="text-gray-600">
                {staff.first_name} {staff.last_name} - {staff.role}
              </p>
            )}
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSchedule(null)
                setFormData({
                  date: "",
                  start_time: "",
                  end_time: "",
                  shift_type: "regular",
                  status: "scheduled",
                  notes: "",
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</DialogTitle>
              <DialogDescription>
                {editingSchedule ? "Update the schedule entry" : "Create a new schedule entry for this staff member"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shift_type">Shift Type</Label>
                  <Select
                    value={formData.shift_type}
                    onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this schedule entry..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSchedule}>{editingSchedule ? "Update Schedule" : "Add Schedule"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Entries
          </CardTitle>
          <CardDescription>Manage work schedules and shifts for this staff member</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schedule entries found</p>
              <p className="text-sm">Add a schedule entry to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{new Date(schedule.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getShiftTypeColor(schedule.shift_type)}>{schedule.shift_type}</Badge>
                        <Badge className={getStatusColor(schedule.status)}>{schedule.status}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(schedule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {schedule.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {schedule.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
