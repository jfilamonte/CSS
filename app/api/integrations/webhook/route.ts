import { type NextRequest, NextResponse } from "next/server"
import { sendWebhook, exportCRMData } from "@/lib/integrations/webhooks"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { event, data } = await request.json()

    const result = await sendWebhook(event, data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Webhook API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "leads" | "quotes" | "customers" | "projects"

    if (!type) {
      return NextResponse.json({ error: "Type parameter required" }, { status: 400 })
    }

    const result = await exportCRMData(type)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
