import { createClient } from "@/lib/supabase/server"

export interface AuditLog {
  id?: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

export class AuditLogger {
  private static instance: AuditLogger

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async log(entry: Omit<AuditLog, "timestamp">) {
    const supabase = await createClient()

    const auditEntry: AuditLog = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    console.log(`[v0] Audit log: ${entry.action} on ${entry.resource_type}:${entry.resource_id}`)

    const { error } = await supabase.from("audit_logs").insert(auditEntry)

    if (error) {
      console.error("[v0] Failed to log audit entry:", error)
    }

    // Also trigger workflow if needed
    const workflowEngine = WorkflowEngine.getInstance()
    await workflowEngine.executeWorkflow("audit_log_created", auditEntry)
  }

  async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: { old: any; new: any },
  ) {
    await this.log({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: changes?.old,
      new_values: changes?.new,
    })
  }

  async getAuditTrail(resourceType: string, resourceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        users:user_id (
          email,
          full_name
        )
      `)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("timestamp", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch audit trail:", error)
      return []
    }

    return data || []
  }
}

// Import WorkflowEngine to avoid circular dependency
import { WorkflowEngine } from "./workflow-engine"
