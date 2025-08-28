import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const requestCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds cache

async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createClient()

    console.log("[v0] Supabase client created successfully")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      if (authError?.message?.includes("Too Many")) {
        console.error("[v0] Rate limit exceeded, retrying...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { error: "Rate limit exceeded, please try again", status: 429 }
      }
      console.error("[v0] Auth error or no user:", authError?.message || "No user")
      return { error: "Unauthorized", status: 401 }
    }

    const cacheKey = `user_role_${user.id}`
    const cached = requestCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[v0] Using cached role for user:", user.email)
      return { ...user, role: cached.data.role, supabase }
    }

    const { data: userRecord, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      if (roleError.message?.includes("Too Many")) {
        console.error("[v0] Rate limit in role lookup, retrying...")
        return { error: "Rate limit exceeded, please try again", status: 429 }
      }
      console.error("[v0] Role lookup error:", roleError)
      return { error: "Unauthorized", status: 401 }
    }

    if (!userRecord || userRecord.role !== "admin") {
      console.error("[v0] No admin user found for user:", user.id)
      return { error: "Unauthorized", status: 401 }
    }

    requestCache.set(cacheKey, { data: userRecord, timestamp: Date.now() })

    return { ...user, role: userRecord.role, supabase }
  } catch (error: any) {
    if (error.message?.includes("Unexpected token") || error.message?.includes("Too Many")) {
      console.error("[v0] Rate limiting detected:", error.message)
      return { error: "Rate limit exceeded, please try again", status: 429 }
    }
    console.error("[v0] Unexpected error in requireAdmin:", error)
    return { error: "Internal server error", status: 500 }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - GET request started")

    const cacheKey = "appointments_list"
    const cached = requestCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[v0] Returning cached appointments")
      return NextResponse.json(cached.data)
    }

    const adminResult = await requireAdmin(request)

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult

    const { data: appointments, error: dbError } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("[v0] Appointments API - Database error:", dbError)
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
    }

    const result = appointments || []
    requestCache.set(cacheKey, { data: result, timestamp: Date.now() })

    console.log("[v0] Appointments API - Success, found", result.length, "appointments")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Appointments API - POST request started")
    const adminResult = await requireAdmin(request)

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult
    const data = await request.json()

    const { error: insertError } = await supabase.from("appointments").insert([data])

    if (insertError) {
      console.error("[v0] Appointments API - Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
    }

    console.log("[v0] Appointments API - Appointment created:", data.title)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Appointments API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
