"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, User, Activity, Filter } from "lucide-react"

interface AuditTrailViewerProps {
  resourceType?: string
  resourceId?: string
}

export function AuditTrailViewer({ resourceType, resourceId }: AuditTrailViewerProps) {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: "all",
    user: "",
    dateRange: "7d",
  })

  useEffect(() => {
    loadAuditLogs()
  }, [resourceType, resourceId, filters])

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (resourceType) params.append("resource_type", resourceType)
      if (resourceId) params.append("resource_id", resourceId)
      if (filters.action !== "all") params.append("action", filters.action)
      if (filters.user) params.append("user", filters.user)
      if (filters.dateRange) params.append("date_range", filters.dateRange)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()
      setAuditLogs(data.logs || [])
    } catch (error) {
      console.error("[v0] Failed to load audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800"
      case "update":
        return "bg-blue-100 text-blue-800"
      case "delete":
        return "bg-red-100 text-red-800"
      case "login":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Audit Trail
        </CardTitle>

        <div className="flex gap-4 mt-4">
          <Select value={filters.action} onValueChange={(value) => setFilters((prev) => ({ ...prev, action: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by user"
            value={filters.user}
            onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))}
            className="w-40"
          />

          <Select
            value={filters.dateRange}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadAuditLogs}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading audit trail...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found</div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionColor(log.action)}>{log.action.toUpperCase()}</Badge>
                    <span className="font-medium">{log.resource_type}</span>
                    <span className="text-gray-500">#{log.resource_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span>{log.users?.full_name || log.users?.email || "Unknown User"}</span>
                </div>

                {(log.old_values || log.new_values) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium mb-2">Changes:</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.old_values && (
                        <div>
                          <div className="font-medium text-red-600">Before:</div>
                          <pre className="text-xs bg-white p-2 rounded border">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <div className="font-medium text-green-600">After:</div>
                          <pre className="text-xs bg-white p-2 rounded border">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
