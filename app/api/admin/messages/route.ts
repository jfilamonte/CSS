import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Get user role
  const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userError || userData?.role !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, supabase }
}

export async function GET() {
  try {
    console.log("[v0] Messages API - GET request started")
    const { supabase } = await requireAdmin()

    // Check if messages table exists, if not return empty array
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      if (error.message.includes("does not exist") || error.message.includes("not found")) {
        console.log("[v0] Messages table not found, returning empty array")
        return NextResponse.json([])
      }
      throw error
    }

    console.log(`[v0] Messages API - Success, found ${messages?.length || 0} messages`)
    return NextResponse.json(messages || [])
  } catch (error: any) {
    console.error("[v0] Messages API - Error:", error.message)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Messages API - POST request started")
    const { supabase } = await requireAdmin()
    const body = await request.json()

    const messageData = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      subject: body.subject,
      message: body.message,
      status: body.status || "new",
      priority: body.priority || "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("messages").insert([messageData]).select().single()

    if (error) {
      throw error
    }

    console.log("[v0] Messages API - Message created successfully")
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Messages API - POST error:", error.message)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
