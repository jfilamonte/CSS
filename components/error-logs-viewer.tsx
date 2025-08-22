"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, RefreshCw, AlertTriangle, Info, AlertCircle, Bug } from "lucide-react"
import { errorLogger, type ErrorLog } from "@/lib/error-logger"

export function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/error-logs${filter !== "all" ? `?level=${filter}` : ""}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      errorLogger.logError(error as Error, "error", { component: "ErrorLogsViewer" })
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/admin/error-logs", { method: "DELETE" })
      if (response.ok) {
        setLogs([])
        errorLogger.clearLogs()
      }
    } catch (error) {
      errorLogger.logError(error as Error, "error", { component: "ErrorLogsViewer" })
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />
      case "debug":
        return <Bug className="w-4 h-4 text-gray-500" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800"
      case "warn":
        return "bg-yellow-100 text-yellow-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      case "debug":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Error Logs ({logs.length})
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No error logs found</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(log.level)}
                    <Badge className={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                    <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm font-medium mb-1">{log.message}</p>
                {log.url && <p className="text-xs text-gray-500 mb-1">URL: {log.url}</p>}
                {log.stack && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-gray-800">Stack Trace</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{log.stack}</pre>
                  </details>
                )}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-gray-800">Metadata</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
