import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: content, error } = await supabase.from("cms_content").select("*").single()

    if (error && error.code !== "PGRST116") {
      // Not found is OK
      console.error("Error fetching CMS content:", error)
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
    }

    return NextResponse.json({
      content: content || {
        hero_title: "",
        hero_subtitle: "",
        about_text: "",
        services_text: "",
        contact_info: "",
      },
    })
  } catch (error) {
    console.error("CMS GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { hero_title, hero_subtitle, about_text, services_text, contact_info } = body

    const { data, error } = await supabase
      .from("cms_content")
      .upsert({
        id: 1, // Single row for CMS content
        hero_title,
        hero_subtitle,
        about_text,
        services_text,
        contact_info,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving CMS content:", error)
      return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
    }

    return NextResponse.json({ success: true, content: data })
  } catch (error) {
    console.error("CMS POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
