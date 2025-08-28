import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const roleCache = new Map<string, { role: string; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

async function requireAdmin() {
  const supabase = await createClient()

  console.log("[v0] Supabase client created successfully")

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      if (authError?.message?.includes("Too Many") || authError?.message?.includes("Unexpected token")) {
        console.log("[v0] Rate limit detected in auth, backing off...")
        return { error: "Service temporarily unavailable", status: 503 }
      }
      console.error("[v0] Auth error or no user:", authError?.message || "No user")
      return { error: "Unauthorized", status: 401 }
    }

    const cached = roleCache.get(user.id)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[v0] Using cached role for user:", user.id)
      return { ...user, role: cached.role, supabase }
    }

    const { data: userRecord, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError) {
      if (roleError.message?.includes("Too Many")) {
        console.log("[v0] Rate limit in role lookup, retrying...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { error: "Rate limited, please try again", status: 429 }
      }
      console.error("[v0] Role lookup error:", roleError.message)
      return { error: "Authentication failed", status: 401 }
    }

    if (!userRecord || userRecord.role !== "admin") {
      console.error("[v0] No admin user found for user:", user.id)
      return { error: "Insufficient permissions", status: 403 }
    }

    roleCache.set(user.id, { role: userRecord.role, timestamp: Date.now() })

    return { ...user, role: userRecord.role, supabase }
  } catch (error: any) {
    if (error.message?.includes("Unexpected token")) {
      console.log("[v0] Rate limit detected, backing off...")
      return { error: "Service temporarily unavailable", status: 503 }
    }
    console.error("[v0] Unexpected error in requireAdmin:", error)
    return { error: "Authentication failed", status: 500 }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - GET request started")
    const adminResult = await requireAdmin()

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult

    let seoSettings, dbError
    try {
      const result = await supabase.from("business_settings").select("*").eq("setting_category", "seo")

      seoSettings = result.data
      dbError = result.error
    } catch (fetchError: any) {
      if (fetchError.message?.includes("Unexpected token") || fetchError.message?.includes("Too Many")) {
        console.log("[v0] SEO Settings API - Rate limit detected in database query")
        return NextResponse.json(
          {
            error: "Service temporarily unavailable",
            fallback: {},
          },
          { status: 503 },
        )
      }
      throw fetchError
    }

    if (dbError) {
      if (dbError.message?.includes("Too Many") || dbError.message?.includes("Unexpected token")) {
        console.log("[v0] SEO Settings API - Database rate limit, returning fallback")
        return NextResponse.json(
          {
            error: "Service temporarily unavailable",
            fallback: {},
          },
          { status: 503 },
        )
      }
      console.error("[v0] SEO Settings API - Database error:", dbError.message)
      return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 })
    }

    const seoData =
      seoSettings?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {}) || {}

    console.log("[v0] SEO Settings API - Success")
    return NextResponse.json(seoData)
  } catch (error: any) {
    if (error.message?.includes("Unexpected token") || error.message?.includes("Too Many")) {
      console.log("[v0] SEO Settings API - Rate limit in top-level catch")
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          fallback: {},
        },
        { status: 503 },
      )
    }
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - PUT request started")
    const adminResult = await requireAdmin()

    if ("error" in adminResult) {
      return NextResponse.json({ error: adminResult.error }, { status: adminResult.status })
    }

    const { supabase } = adminResult
    const data = await request.json()

    const settingsToUpsert = Object.entries(data).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      setting_category: "seo",
      updated_at: new Date().toISOString(),
    }))

    const { data: updatedSettings, error: updateError } = await supabase
      .from("business_settings")
      .upsert(settingsToUpsert)
      .select()

    if (updateError) {
      console.error("[v0] SEO Settings API - Update error:", updateError)
      return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
    }

    console.log("[v0] SEO Settings API - Settings updated:", Object.keys(data).length, "fields")
    return NextResponse.json(updatedSettings || data)
  } catch (error) {
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
