import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = (formData.get("category") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
    })

    const dimensions = `${file.size} bytes`

    const { data: image, error } = await supabase
      .from("gallery_images")
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        description: "",
        url: blob.url,
        category,
        tags: [],
        file_size: file.size,
        dimensions,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving image metadata:", error)
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 })
    }

    return NextResponse.json({ success: true, image })
  } catch (error) {
    console.error("Gallery upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
