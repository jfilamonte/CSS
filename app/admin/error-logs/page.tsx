"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react"

export default function ErrorLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          router.push("/auth/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError || userData?.role !== "admin") {
          router.push("/")
          return
        }

        setUser(user)
        await loadErrorLogs()
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadErrorLogs = async () => {
    try {
      const response = await fetch("/api/admin/error-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        console.error("Failed to load error logs")
      }
    } catch (error) {
      console.error("Failed to load error logs:", error)
    }
  }

  const filteredLogs = logs.filter((log: any) => filter === "all" || log.severity === filter)

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all error logs?")) return

    try {
      const response = await fetch("/api/admin/error-logs", {
        method: "DELETE",
      })
      if (response.ok) {
        setLogs([])
        console.log("Error logs cleared successfully")
      } else {
        alert("Failed to clear logs")
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
      alert("Failed to clear logs")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading error logs...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.push("/admin-new")} className="mr-4">
              {" "}
              {/* Updated from /admin to /admin-new */}
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter logs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadErrorLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <Button variant="destructive" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Logs
          </Button>
        </div>

        <div className="space-y-4">
          {filteredLogs.map((log: any) => (
            <Card key={log.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        log.severity === "error" ? "destructive" : log.severity === "warning" ? "secondary" : "default"
                      }
                    >
                      {log.severity?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown time"}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-lg">{log.error_message || "No error message"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {log.error_stack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stack Trace:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto border">{log.error_stack}</pre>
                  </div>
                )}
                {log.context && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Context:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border">
                      {typeof log.context === "string" ? log.context : JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                )}
                {log.url && (
                  <div className="text-sm text-gray-600">
                    <strong>URL:</strong> {log.url}
                  </div>
                )}
                {log.user_agent && (
                  <div className="text-sm text-gray-600">
                    <strong>User Agent:</strong> {log.user_agent}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">No error logs found.</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
