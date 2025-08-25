export interface ErrorLog {
  id: string
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
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  async logError(error: Error | string, severity: ErrorLog["severity"] = "error", context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      severity,
      error_message: typeof error === "string" ? error : error.message,
      error_stack: typeof error === "object" ? error.stack : undefined,
      error_type: typeof error === "object" && error.name ? error.name : "ApplicationError",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      context,
    }

    // Store in memory
    this.logs.push(errorLog)

    console.log(`[v0] Error logged:`, errorLog)

    // Only try API call in production environment
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      try {
        await fetch("/api/admin/error-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorLog),
        })
      } catch (e) {
        console.error("Failed to log error to database:", e)
      }
    }

    console.error(`[${severity.toUpperCase()}]`, errorLog.error_message, errorLog.error_stack)
  }

  getLogs(): ErrorLog[] {
    return this.logs
  }

  clearLogs(): void {
    this.logs = []
  }
}

export const errorLogger = ErrorLogger.getInstance()

// Global error handlers
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    errorLogger.logError(event.error || event.message, "error", {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    errorLogger.logError(event.reason, "error", { type: "unhandledrejection" })
  })
}

export const logError = async (
  error: Error | string,
  options?: {
    severity?: ErrorLog["severity"]
    context?: Record<string, any>
    error_type?: string
  },
) => {
  const severity = options?.severity || "error"
  const context = options?.context
  if (options?.error_type && typeof error === "object") {
    ;(error as any).name = options.error_type
  }
  return errorLogger.logError(error, severity, context)
}
