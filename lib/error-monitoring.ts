import { createClient } from "@/lib/supabase/client"

export interface ErrorReport {
  id?: string
  error_type: "javascript" | "api" | "database" | "network" | "validation" | "auth"
  error_message: string
  error_stack?: string
  user_id?: string
  session_id?: string
  url: string
  user_agent: string
  timestamp: Date
  severity: "low" | "medium" | "high" | "critical"
  context?: Record<string, any>
  resolved: boolean
  resolution_notes?: string
}

export interface PerformanceMetric {
  id?: string
  metric_type: "page_load" | "api_response" | "database_query" | "component_render"
  metric_name: string
  value: number
  unit: "ms" | "bytes" | "count"
  url: string
  user_id?: string
  timestamp: Date
  context?: Record<string, any>
}

class ErrorMonitoringService {
  private supabase = createClient()
  private sessionId: string
  private errorQueue: ErrorReport[] = []
  private performanceQueue: PerformanceMetric[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeErrorHandlers()
    this.startPerformanceMonitoring()
    this.startQueueFlush()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeErrorHandlers() {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.logError({
        error_type: "javascript",
        error_message: event.message,
        error_stack: event.error?.stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date(),
        severity: "high",
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        resolved: false,
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        error_type: "javascript",
        error_message: event.reason?.message || "Unhandled Promise Rejection",
        error_stack: event.reason?.stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date(),
        severity: "high",
        context: {
          reason: event.reason,
        },
        resolved: false,
      })
    })

    // Network error monitoring
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()

        // Log API performance
        this.logPerformance({
          metric_type: "api_response",
          metric_name: args[0].toString(),
          value: endTime - startTime,
          unit: "ms",
          url: window.location.href,
          timestamp: new Date(),
          context: {
            status: response.status,
            method: args[1]?.method || "GET",
          },
        })

        // Log API errors
        if (!response.ok) {
          this.logError({
            error_type: "api",
            error_message: `API Error: ${response.status} ${response.statusText}`,
            url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date(),
            severity: response.status >= 500 ? "critical" : "medium",
            context: {
              endpoint: args[0],
              method: args[1]?.method || "GET",
              status: response.status,
              statusText: response.statusText,
            },
            resolved: false,
          })
        }

        return response
      } catch (error: any) {
        const endTime = performance.now()

        this.logError({
          error_type: "network",
          error_message: error.message || "Network Error",
          error_stack: error.stack,
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date(),
          severity: "critical",
          context: {
            endpoint: args[0],
            method: args[1]?.method || "GET",
            duration: endTime - startTime,
          },
          resolved: false,
        })

        throw error
      }
    }
  }

  private startPerformanceMonitoring() {
    // Page load performance
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

      this.logPerformance({
        metric_type: "page_load",
        metric_name: "dom_content_loaded",
        value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        unit: "ms",
        url: window.location.href,
        timestamp: new Date(),
      })

      this.logPerformance({
        metric_type: "page_load",
        metric_name: "full_page_load",
        value: navigation.loadEventEnd - navigation.loadEventStart,
        unit: "ms",
        url: window.location.href,
        timestamp: new Date(),
      })
    })

    // Monitor Core Web Vitals
    if ("web-vital" in window) {
      // This would integrate with web-vitals library if available
      // For now, we'll use basic performance monitoring
    }
  }

  private startQueueFlush() {
    this.flushInterval = setInterval(() => {
      this.flushQueues()
    }, 10000) // Flush every 10 seconds
  }

  public async logError(error: Omit<ErrorReport, "session_id">) {
    const errorReport: ErrorReport = {
      ...error,
      session_id: this.sessionId,
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorReport)

    // For critical errors, flush immediately
    if (error.severity === "critical") {
      await this.flushQueues()
    }

    // Console log for development
    if (process.env.NODE_ENV === "development") {
      console.error("[v0] Error logged:", errorReport)
    }
  }

  public async logPerformance(metric: Omit<PerformanceMetric, "session_id">) {
    const performanceMetric: PerformanceMetric = {
      ...metric,
    }

    this.performanceQueue.push(performanceMetric)

    // Console log for development
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Performance metric:", performanceMetric)
    }
  }

  private async flushQueues() {
    try {
      // Flush error queue
      if (this.errorQueue.length > 0) {
        const errors = [...this.errorQueue]
        this.errorQueue = []

        const { error } = await this.supabase.from("error_logs").insert(errors)

        if (error) {
          console.error("[v0] Failed to flush error queue:", error)
          // Re-add errors to queue for retry
          this.errorQueue.unshift(...errors)
        }
      }

      // Flush performance queue
      if (this.performanceQueue.length > 0) {
        const metrics = [...this.performanceQueue]
        this.performanceQueue = []

        const { error } = await this.supabase.from("performance_metrics").insert(metrics)

        if (error) {
          console.error("[v0] Failed to flush performance queue:", error)
          // Re-add metrics to queue for retry
          this.performanceQueue.unshift(...metrics)
        }
      }
    } catch (error) {
      console.error("[v0] Error flushing queues:", error)
    }
  }

  public async getErrorStats(timeframe: "1h" | "24h" | "7d" | "30d" = "24h") {
    const timeMap = {
      "1h": 1,
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    }

    const hoursAgo = timeMap[timeframe]
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    try {
      const { data, error } = await this.supabase
        .from("error_logs")
        .select("error_type, severity, resolved")
        .gte("timestamp", since.toISOString())

      if (error) throw error

      const stats = {
        total: data.length,
        by_type: {} as Record<string, number>,
        by_severity: {} as Record<string, number>,
        resolved: data.filter((e) => e.resolved).length,
        unresolved: data.filter((e) => !e.resolved).length,
      }

      data.forEach((error) => {
        stats.by_type[error.error_type] = (stats.by_type[error.error_type] || 0) + 1
        stats.by_severity[error.severity] = (stats.by_severity[error.severity] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error("[v0] Failed to get error stats:", error)
      return null
    }
  }

  public async getPerformanceStats(timeframe: "1h" | "24h" | "7d" | "30d" = "24h") {
    const timeMap = {
      "1h": 1,
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    }

    const hoursAgo = timeMap[timeframe]
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    try {
      const { data, error } = await this.supabase
        .from("performance_metrics")
        .select("metric_type, metric_name, value, unit")
        .gte("timestamp", since.toISOString())

      if (error) throw error

      const stats = {
        total_metrics: data.length,
        avg_page_load: 0,
        avg_api_response: 0,
        slowest_endpoints: [] as Array<{ name: string; avg_time: number }>,
      }

      const pageLoads = data.filter((m) => m.metric_type === "page_load")
      const apiResponses = data.filter((m) => m.metric_type === "api_response")

      if (pageLoads.length > 0) {
        stats.avg_page_load = pageLoads.reduce((sum, m) => sum + m.value, 0) / pageLoads.length
      }

      if (apiResponses.length > 0) {
        stats.avg_api_response = apiResponses.reduce((sum, m) => sum + m.value, 0) / apiResponses.length

        // Group by endpoint and calculate averages
        const endpointStats = apiResponses.reduce(
          (acc, m) => {
            if (!acc[m.metric_name]) {
              acc[m.metric_name] = { total: 0, count: 0 }
            }
            acc[m.metric_name].total += m.value
            acc[m.metric_name].count += 1
            return acc
          },
          {} as Record<string, { total: number; count: number }>,
        )

        stats.slowest_endpoints = Object.entries(endpointStats)
          .map(([name, stats]) => ({
            name,
            avg_time: stats.total / stats.count,
          }))
          .sort((a, b) => b.avg_time - a.avg_time)
          .slice(0, 10)
      }

      return stats
    } catch (error) {
      console.error("[v0] Failed to get performance stats:", error)
      return null
    }
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushQueues() // Final flush
  }
}

// Global instance
export const errorMonitoring = new ErrorMonitoringService()

// React hook for error monitoring
export function useErrorMonitoring() {
  return {
    logError: errorMonitoring.logError.bind(errorMonitoring),
    logPerformance: errorMonitoring.logPerformance.bind(errorMonitoring),
    getErrorStats: errorMonitoring.getErrorStats.bind(errorMonitoring),
    getPerformanceStats: errorMonitoring.getPerformanceStats.bind(errorMonitoring),
  }
}
