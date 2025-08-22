import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Supabase client created successfully")
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = (formData.get("category") as string) || "general"
    const projectId = formData.get("projectId") as string
    const description = formData.get("description") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    if (projectId) {
      // Update project with photo information
      const { data: project } = await supabase.from("projects").select("project_photos").eq("id", projectId).single()

      const existingPhotos = project?.project_photos || []
      const newPhoto = {
        id: crypto.randomUUID(),
        filename: file.name,
        url: blob.url,
        type: file.type,
        size: file.size,
        category,
        description,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      }

      const updatedPhotos = [...existingPhotos, newPhoto]

      await supabase.from("projects").update({ project_photos: updatedPhotos }).eq("id", projectId)
    }

    return NextResponse.json({
      id: crypto.randomUUID(),
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      category,
      description,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
