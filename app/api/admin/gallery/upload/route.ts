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

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title: `Gallery Image - ${file.name.replace(/\.[^/.]+$/, "")}`,
        description: "Gallery image uploaded via admin",
        customer_id: user.id,
        status: "gallery",
        project_photos: [
          {
            id: Date.now().toString(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: "",
            url: blob.url,
            category,
            file_size: file.size,
            dimensions: `${file.size} bytes`,
            uploaded_at: new Date().toISOString(),
          },
        ],
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving image metadata:", error)
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: project.project_photos[0] })
  } catch (error) {
    console.error("Gallery upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
