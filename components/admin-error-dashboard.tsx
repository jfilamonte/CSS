"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react"
import { useErrorMonitoring } from "@/lib/error-monitoring"

export default function AdminErrorDashboard() {
  const { getErrorStats, getPerformanceStats } = useErrorMonitoring()
  const [timeframe, setTimeframe] = useState<"1h" | "24h" | "7d" | "30d">("24h")
  const [errorStats, setErrorStats] = useState<any>(null)
  const [performanceStats, setPerformanceStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [timeframe])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [errors, performance] = await Promise.all([getErrorStats(timeframe), getPerformanceStats(timeframe)])
      setErrorStats(errors)
      setPerformanceStats(performance)
    } catch (error) {
      console.error("[v0] Failed to load error dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "javascript":
        return "destructive"
      case "api":
        return "secondary"
      case "database":
        return "destructive"
      case "network":
        return "secondary"
      case "validation":
        return "outline"
      case "auth":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Error Monitoring Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Error Monitoring Dashboard</h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadStats} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold">{errorStats?.total || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unresolved</p>
                <p className="text-2xl font-bold text-red-600">{errorStats?.unresolved || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{errorStats?.resolved || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Page Load</p>
                <p className="text-2xl font-bold">
                  {performanceStats?.avg_page_load ? `${Math.round(performanceStats.avg_page_load)}ms` : "N/A"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Errors by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
                <CardDescription>Distribution of error types in the selected timeframe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorStats?.by_type &&
                    Object.entries(errorStats.by_type).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeColor(type)}>{type}</Badge>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  {(!errorStats?.by_type || Object.keys(errorStats.by_type).length === 0) && (
                    <p className="text-gray-500 text-center py-4">No errors in this timeframe</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Errors by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
                <CardDescription>Severity distribution of errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorStats?.by_severity &&
                    Object.entries(errorStats.by_severity).map(([severity, count]: [string, any]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(severity)}>{severity}</Badge>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  {(!errorStats?.by_severity || Object.keys(errorStats.by_severity).length === 0) && (
                    <p className="text-gray-500 text-center py-4">No errors in this timeframe</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Page Load</span>
                    <span className="font-semibold">
                      {performanceStats?.avg_page_load ? `${Math.round(performanceStats.avg_page_load)}ms` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average API Response</span>
                    <span className="font-semibold">
                      {performanceStats?.avg_api_response
                        ? `${Math.round(performanceStats.avg_api_response)}ms`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Metrics</span>
                    <span className="font-semibold">{performanceStats?.total_metrics || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slowest Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Slowest Endpoints</CardTitle>
                <CardDescription>API endpoints with highest response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceStats?.slowest_endpoints?.slice(0, 5).map((endpoint: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {endpoint.name.replace(/^https?:\/\/[^/]+/, "")}
                      </span>
                      <Badge variant="outline">{Math.round(endpoint.avg_time)}ms</Badge>
                    </div>
                  ))}
                  {(!performanceStats?.slowest_endpoints || performanceStats.slowest_endpoints.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No performance data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
