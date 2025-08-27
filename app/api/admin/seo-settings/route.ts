import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()

  console.log("[v0] Supabase client created successfully")

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] Auth error or no user:", authError?.message || "No user")
    throw new Error("Unauthorized")
  }

  const { data: userRecord } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userRecord || userRecord.role !== "admin") {
    console.error("[v0] No admin user found for user:", user.id)
    throw new Error("Unauthorized")
  }

  return { ...user, role: userRecord.role, supabase }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - GET request started")
    const { supabase } = await requireAdmin()

    const { data: seoSettings, error: dbError } = await supabase.from("seo_settings").select("*").single()

    if (dbError) {
      console.error("[v0] SEO Settings API - Database error:", dbError)
      throw new Error(`Database error accessing seo_settings table: ${dbError.message}`)
    }

    console.log("[v0] SEO Settings API - Success")
    return NextResponse.json(seoSettings || {})
  } catch (error) {
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch SEO settings" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - PUT request started")
    const { supabase } = await requireAdmin()
    const data = await request.json()

    const { data: updatedSettings, error: updateError } = await supabase
      .from("seo_settings")
      .upsert(data)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] SEO Settings API - Update error:", updateError)
      throw new Error(`Failed to update SEO settings: ${updateError.message}`)
    }

    console.log("[v0] SEO Settings API - Settings updated:", Object.keys(data).length, "fields")
    return NextResponse.json(updatedSettings || data)
  } catch (error) {
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update SEO settings" },
      { status: 500 },
    )
  }
}
