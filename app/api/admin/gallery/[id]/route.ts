import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "ADMIN", "staff", "STAFF"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const imageId = params.id

    // Delete gallery image
    const { error } = await supabase.from("gallery_images").delete().eq("id", imageId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gallery DELETE API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
