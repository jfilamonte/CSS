import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const mockLogs = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        severity: "info",
        error_message: "System initialized successfully",
        error_stack: null,
        error_type: "SystemInfo",
        url: "/admin",
        user_agent: "Mozilla/5.0...",
        user_id: "b3d97e60-6453-4e9f-a673-ef0d910e5a49",
        session_id: "session_123",
        context: { action: "admin_login" },
        resolved: false,
      },
    ]

    console.log("[v0] Error logs API returning mock data")
    return NextResponse.json({ logs: mockLogs })
  } catch (error) {
    console.error("Error in error-logs GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const errorLog = await request.json()

    console.log("[v0] Error log received:", errorLog)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in error-logs POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] Error logs cleared (mock)")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
