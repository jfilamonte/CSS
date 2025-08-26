import { createClient } from "@/lib/supabase/server"

export interface WorkflowTrigger {
  id: string
  name: string
  event: string
  conditions: Record<string, any>
  actions: WorkflowAction[]
  enabled: boolean
}

export interface WorkflowAction {
  type: "email" | "notification" | "update_status" | "create_task" | "webhook"
  config: Record<string, any>
}

export class WorkflowEngine {
  private static instance: WorkflowEngine
  private triggers: Map<string, WorkflowTrigger> = new Map()

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine()
    }
    return WorkflowEngine.instance
  }

  async loadTriggers() {
    const supabase = await createClient()
    const { data: triggers } = await supabase.from("workflow_triggers").select("*").eq("enabled", true)

    if (triggers) {
      triggers.forEach((trigger) => {
        this.triggers.set(trigger.event, trigger)
      })
    }
  }

  async executeWorkflow(event: string, data: any) {
    const trigger = this.triggers.get(event)
    if (!trigger) return

    console.log(`[v0] Executing workflow for event: ${event}`)

    // Check conditions
    if (!this.evaluateConditions(trigger.conditions, data)) {
      return
    }

    // Execute actions
    for (const action of trigger.actions) {
      await this.executeAction(action, data)
    }

    // Log workflow execution
    await this.logWorkflowExecution(trigger.id, event, data)
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    // Simple condition evaluation - can be enhanced with complex logic
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false
      }
    }
    return true
  }

  private async executeAction(action: WorkflowAction, data: any) {
    const supabase = await createClient()

    switch (action.type) {
      case "email":
        await this.sendEmail(action.config, data)
        break
      case "notification":
        await this.createNotification(action.config, data)
        break
      case "update_status":
        await this.updateStatus(action.config, data)
        break
      case "create_task":
        await this.createTask(action.config, data)
        break
      case "webhook":
        await this.callWebhook(action.config, data)
        break
    }
  }

  private async sendEmail(config: any, data: any) {
    // Email sending logic using Resend
    console.log(`[v0] Sending email: ${config.template} to ${config.recipient}`)
  }

  private async createNotification(config: any, data: any) {
    const supabase = await createClient()
    await supabase.from("notifications").insert({
      user_id: config.user_id || data.user_id,
      title: config.title,
      message: config.message,
      type: config.type || "info",
      created_at: new Date().toISOString(),
    })
  }

  private async updateStatus(config: any, data: any) {
    const supabase = await createClient()
    await supabase.from(config.table).update({ status: config.status }).eq("id", data.id)
  }

  private async createTask(config: any, data: any) {
    const supabase = await createClient()
    await supabase.from("tasks").insert({
      title: config.title,
      description: config.description,
      assigned_to: config.assigned_to,
      project_id: data.project_id,
      due_date: config.due_date,
      created_at: new Date().toISOString(),
    })
  }

  private async callWebhook(config: any, data: any) {
    await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, ...config.payload }),
    })
  }

  private async logWorkflowExecution(triggerId: string, event: string, data: any) {
    const supabase = await createClient()
    await supabase.from("workflow_logs").insert({
      trigger_id: triggerId,
      event,
      data,
      executed_at: new Date().toISOString(),
    })
  }
}
