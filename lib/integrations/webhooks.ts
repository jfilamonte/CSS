import { prisma } from "@/lib/database"

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: "lead.created",
  QUOTE_SENT: "quote.sent",
  QUOTE_ACCEPTED: "quote.accepted",
  PROJECT_STARTED: "project.started",
  PROJECT_COMPLETED: "project.completed",
  APPOINTMENT_BOOKED: "appointment.booked",
  PAYMENT_RECEIVED: "payment.received",
  MESSAGE_SENT: "message.sent",
} as const

export async function sendWebhook(event: string, data: any) {
  try {
    const webhookUrls = await prisma.siteSettings.findFirst({
      select: { webhookUrls: true },
    })

    if (!webhookUrls?.webhookUrls) {
      return { success: false, error: "No webhook URLs configured" }
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    const results = await Promise.allSettled(
      (webhookUrls.webhookUrls as string[]).map(async (url) => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Source": "crafted-surface-solutions",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`)
        }

        return response.json()
      }),
    )

    return { success: true, results }
  } catch (error) {
    console.error("Error sending webhook:", error)
    return { success: false, error }
  }
}

export async function exportCRMData(type: "leads" | "quotes" | "customers" | "projects") {
  try {
    let data

    switch (type) {
      case "leads":
        data = await prisma.lead.findMany({
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        break
      case "quotes":
        data = await prisma.quote.findMany({
          include: { customer: true, lead: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        break
      case "customers":
        data = await prisma.user.findMany({
          where: { role: "CUSTOMER" },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        break
      case "projects":
        data = await prisma.project.findMany({
          include: { customer: true, quote: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        break
      default:
        throw new Error("Invalid export type")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error exporting CRM data:", error)
    return { success: false, error }
  }
}
