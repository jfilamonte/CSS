import { createClient } from "@/lib/supabase/client"

export interface ErrorLog {
  id?: string
  timestamp: Date
  severity: "error" | "warn" | "info" | "debug"
  error_message: string
  error_stack?: string
  error_type: string
  url?: string
  user_agent?: string
  user_id?: string
  session_id?: string
  context?: Record<string, any>
  resolved?: boolean
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

class UnifiedErrorLogger {
  private static instance: UnifiedErrorLogger
  private supabase = createClient()
  private sessionId: string
  private errorQueue: ErrorLog[] = []
  private performanceQueue: PerformanceMetric[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private isClient = typeof window !== "undefined"

  constructor() {
    this.sessionId = this.generateSessionId()
    if (this.isClient) {
      this.initializeClientHandlers()
      this.startQueueFlush()
    }
  }

  static getInstance(): UnifiedErrorLogger {
    if (!UnifiedErrorLogger.instance) {
      UnifiedErrorLogger.instance = new UnifiedErrorLogger()
    }
    return UnifiedErrorLogger.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeClientHandlers() {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.logError(event.error || event.message, "error", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: "javascript_error",
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.logError(event.reason, "error", {
        type: "unhandled_rejection",
        reason: event.reason,
      })
    })

    // Network monitoring
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()

        // Log performance
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
          this.logError(
            `API Error: ${response.status} ${response.statusText}`,
            response.status >= 500 ? "error" : "warn",
            {
              endpoint: args[0],
              method: args[1]?.method || "GET",
              status: response.status,
              statusText: response.statusText,
              type: "api_error",
            },
          )
        }

        return response
      } catch (error: any) {
        this.logError(error, "error", {
          endpoint: args[0],
          method: args[1]?.method || "GET",
          type: "network_error",
        })
        throw error
      }
    }
  }

  private startQueueFlush() {
    this.flushInterval = setInterval(() => {
      this.flushQueues()
    }, 10000) // Flush every 10 seconds
  }

  async logError(error: Error | string, severity: ErrorLog["severity"] = "error", context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity,
      error_message: typeof error === "string" ? error : error.message,
      error_stack: typeof error === "object" ? error.stack : undefined,
      error_type: context?.type || (typeof error === "object" && error.name ? error.name : "ApplicationError"),
      url: this.isClient ? window.location.href : undefined,
      user_agent: this.isClient ? window.navigator.userAgent : undefined,
      session_id: this.sessionId,
      context,
      resolved: false,
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorLog)

    // Console log for development
    console.log(`[v0] Error logged [${severity.toUpperCase()}]:`, errorLog.error_message)
    if (errorLog.error_stack) {
      console.error(errorLog.error_stack)
    }

    // For critical errors, flush immediately
    if (severity === "error") {
      await this.flushQueues()
    }
  }

  async logPerformance(metric: Omit<PerformanceMetric, "session_id">) {
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

        // Only try database insert in production or when not localhost
        if (this.isClient && window.location.hostname !== "localhost") {
          try {
            const { error } = await this.supabase.from("error_logs").insert(errors)
            if (error) {
              console.error("[v0] Failed to flush error queue:", error)
              // Re-add errors to queue for retry
              this.errorQueue.unshift(...errors.slice(0, 5)) // Limit retry queue
            }
          } catch (e) {
            console.error("[v0] Database error logging failed:", e)
          }
        }
      }

      // Flush performance queue
      if (this.performanceQueue.length > 0) {
        const metrics = [...this.performanceQueue]
        this.performanceQueue = []

        if (this.isClient && window.location.hostname !== "localhost") {
          try {
            const { error } = await this.supabase.from("performance_metrics").insert(metrics)
            if (error) {
              console.error("[v0] Failed to flush performance queue:", error)
              // Re-add metrics to queue for retry
              this.performanceQueue.unshift(...metrics.slice(0, 5)) // Limit retry queue
            }
          } catch (e) {
            console.error("[v0] Database performance logging failed:", e)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error flushing queues:", error)
    }
  }

  getLogs(): ErrorLog[] {
    return this.errorQueue
  }

  clearLogs(): void {
    this.errorQueue = []
    this.performanceQueue = []
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushQueues() // Final flush
  }
}

// Global instance
export const errorLogger = UnifiedErrorLogger.getInstance()

// Convenience functions
export const logError = async (
  error: Error | string,
  options?: {
    severity?: ErrorLog["severity"]
    context?: Record<string, any>
    error_type?: string
  },
) => {
  const severity = options?.severity || "error"
  const context = { ...options?.context }
  if (options?.error_type) {
    context.type = options.error_type
  }
  return errorLogger.logError(error, severity, context)
}

export const logPerformance = async (metric: Omit<PerformanceMetric, "session_id">) => {
  return errorLogger.logPerformance(metric)
}

// React hook for error monitoring
export function useErrorMonitoring() {
  return {
    logError: errorLogger.logError.bind(errorLogger),
    logPerformance: errorLogger.logPerformance.bind(errorLogger),
  }
}
