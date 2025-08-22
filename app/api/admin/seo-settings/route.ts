import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

async function requireAdmin() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized")
  }

  return { ...user, role: profile.role }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - GET request started")
    await requireAdmin()

    const { data: seoSettings, error: dbError } = await supabase.from("seo_settings").select("*").single()

    if (dbError) {
      console.error("[v0] SEO Settings API - Database error:", dbError)
      throw new Error(`Failed to fetch SEO settings: ${dbError.message}`)
    }

    if (!seoSettings) {
      console.error("[v0] SEO Settings API - No SEO settings found")
      throw new Error("SEO settings table does not exist or is empty")
    }

    console.log("[v0] SEO Settings API - Success")
    return NextResponse.json(seoSettings)
  } catch (error) {
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] SEO Settings API - PUT request started")
    await requireAdmin()
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

    if (!updatedSettings) {
      console.error("[v0] SEO Settings API - No data returned after update")
      throw new Error("SEO settings update failed - no data returned")
    }

    console.log("[v0] SEO Settings API - Settings updated:", Object.keys(data).length, "fields")
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("[v0] SEO Settings API - Error:", error)
    return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
  }
}
