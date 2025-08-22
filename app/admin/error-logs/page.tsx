"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ErrorLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    loadErrorLogs()
  }, [])

  const loadErrorLogs = async () => {
    try {
      const response = await fetch("/api/admin/error-logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to load error logs:", error)
      // Mock data for demonstration
      setLogs([
        {
          id: 1,
          severity: "error",
          error_message: "Database connection failed",
          stack_trace: "Error: Connection timeout\n  at Database.connect()",
          created_at: new Date().toISOString(),
          context: { user_id: "user123", action: "login" },
        },
        {
          id: 2,
          severity: "warning",
          error_message: "Slow query detected",
          stack_trace: "Warning: Query took 5.2s to execute",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          context: { query: "SELECT * FROM projects" },
        },
      ])
    }
    setLoading(false)
  }

  const filteredLogs = logs.filter((log: any) => filter === "all" || log.severity === filter)

  const clearLogs = async () => {
    try {
      const response = await fetch("/api/admin/error-logs", {
        method: "DELETE",
      })
      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <div className="flex gap-4">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded">
              <option value="all">All Logs</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
            <button onClick={clearLogs} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Clear Logs
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredLogs.map((log: any) => (
            <div key={log.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      log.severity === "error"
                        ? "bg-red-100 text-red-800"
                        : log.severity === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {log.severity.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">{log.error_message}</h3>
              {log.stack_trace && (
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">{log.stack_trace}</pre>
              )}
              {log.context && (
                <div className="text-sm text-gray-600">
                  <strong>Context:</strong> {JSON.stringify(log.context, null, 2)}
                </div>
              )}
            </div>
          ))}
          {filteredLogs.length === 0 && <div className="text-center py-8 text-gray-500">No error logs found.</div>}
        </div>
      </div>
    </div>
  )
}
