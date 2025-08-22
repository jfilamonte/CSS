"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Users, Calendar, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { getAvailableSalesRepsWithWorkload } from "@/lib/database-actions"

interface SalesRepWorkload {
  repId: string
  firstName: string
  lastName: string
  email: string
  appointmentsThisWeek: number
  appointmentsToday: number
  totalHoursThisWeek: number
  available: boolean
}

export default function SalesRepWorkloadDashboard() {
  const [workloadData, setWorkloadData] = useState<SalesRepWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedTime, setSelectedTime] = useState("09:00")

  useEffect(() => {
    fetchWorkloadData()
  }, [selectedDate, selectedTime])

  const fetchWorkloadData = async () => {
    setLoading(true)
    try {
      const result = await getAvailableSalesRepsWithWorkload(selectedDate, selectedTime)
      if (result.success && result.reps) {
        setWorkloadData(result.reps)
      }
    } catch (error) {
      console.error("Error fetching workload data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWorkloadLevel = (hoursThisWeek: number) => {
    if (hoursThisWeek < 20) return { level: "Light", color: "bg-green-500", percentage: (hoursThisWeek / 40) * 100 }
    if (hoursThisWeek < 35) return { level: "Moderate", color: "bg-yellow-500", percentage: (hoursThisWeek / 40) * 100 }
    return { level: "Heavy", color: "bg-red-500", percentage: Math.min((hoursThisWeek / 40) * 100, 100) }
  }

  const averageWorkload =
    workloadData.length > 0
      ? workloadData.reduce((sum, rep) => sum + rep.totalHoursThisWeek, 0) / workloadData.length
      : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Team Workload</h2>
          <p className="text-gray-600">Monitor team capacity and availability</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={fetchWorkloadData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Reps</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workloadData.length}</div>
            <p className="text-xs text-muted-foreground">
              {workloadData.filter((rep) => rep.available).length} available now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Weekly Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageWorkload.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Hours per rep this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workloadData.reduce((sum, rep) => sum + rep.appointmentsThisWeek, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This week across all reps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workload Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workloadData.length > 0
                ? Math.round(
                    (1 -
                      (Math.max(...workloadData.map((r) => r.totalHoursThisWeek)) -
                        Math.min(...workloadData.map((r) => r.totalHoursThisWeek))) /
                        averageWorkload) *
                      100,
                  )
                : 100}
              %
            </div>
            <p className="text-xs text-muted-foreground">Distribution efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Rep Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workloadData.map((rep) => {
          const workload = getWorkloadLevel(rep.totalHoursThisWeek)
          const isOverloaded = rep.totalHoursThisWeek > averageWorkload * 1.5
          const isUnderloaded = rep.totalHoursThisWeek < averageWorkload * 0.5

          return (
            <Card key={rep.repId} className={`${!rep.available ? "opacity-60" : ""}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {rep.firstName} {rep.lastName}
                    </CardTitle>
                    <CardDescription>{rep.email}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={rep.available ? "default" : "secondary"}>
                      {rep.available ? "Available" : "Unavailable"}
                    </Badge>
                    {isOverloaded && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overloaded
                      </Badge>
                    )}
                    {isUnderloaded && workloadData.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        Light Load
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weekly Hours</span>
                    <span className="font-medium">{rep.totalHoursThisWeek.toFixed(1)}h</span>
                  </div>
                  <Progress value={workload.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{workload.level} workload</span>
                    <span>{workload.percentage.toFixed(0)}% of 40h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">This Week</p>
                    <p className="font-medium">{rep.appointmentsThisWeek} appointments</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Today</p>
                    <p className="font-medium">{rep.appointmentsToday} appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {workloadData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sales representatives found</p>
            <p className="text-sm text-gray-400">Add sales team members to see their workload data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
