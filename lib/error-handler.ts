import { createClient } from "@/lib/supabase/server"

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export class DatabaseError extends Error {
  code: string
  details: any

  constructor(message: string, code = "DATABASE_ERROR", details?: any) {
    super(message)
    this.name = "DatabaseError"
    this.code = code
    this.details = details
  }
}

export class ValidationError extends Error {
  code: string
  field: string

  constructor(message: string, field: string, code = "VALIDATION_ERROR") {
    super(message)
    this.name = "ValidationError"
    this.code = code
    this.field = field
  }
}

export async function logError(error: AppError | Error, context?: string) {
  console.error(`[v0] Error ${context ? `in ${context}` : ""}:`, error)

  try {
    const supabase = createClient()
    await supabase.from("analytics_events").insert({
      event_type: "error",
      event_data: {
        error_message: error.message,
        error_name: error.name,
        context,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (logError) {
    console.error("[v0] Failed to log error to database:", logError)
  }
}

export function handleDatabaseError(error: any, operation: string): never {
  console.error(`[v0] Database error during ${operation}:`, error)

  if (error.message?.includes("violates check constraint")) {
    const constraintMatch = error.message.match(/violates check constraint "([^"]+)"/)
    const constraint = constraintMatch ? constraintMatch[1] : "unknown"
    throw new DatabaseError(`Invalid value for ${constraint}. Please check allowed values.`, "CONSTRAINT_VIOLATION", {
      constraint,
      originalError: error.message,
    })
  }

  if (error.message?.includes("duplicate key")) {
    throw new DatabaseError("A record with this information already exists.", "DUPLICATE_KEY", {
      originalError: error.message,
    })
  }

  throw new DatabaseError(`Database operation failed: ${error.message}`, "DATABASE_ERROR", {
    operation,
    originalError: error.message,
  })
}
