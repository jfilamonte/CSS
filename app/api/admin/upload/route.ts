import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API - POST request started")

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Upload API - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const category = (formData.get("category") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
    })

    const fileData = {
      project_id: projectId,
      file_name: file.name,
      file_url: blob.url,
      file_size: file.size,
      file_type: file.type,
      category: category,
      uploaded_by: user.id,
      created_at: new Date().toISOString(),
    }

    if (projectId) {
      const { data: project } = await supabase.from("projects").select("project_photos").eq("id", projectId).single()

      const existingPhotos = project?.project_photos || []
      const updatedPhotos = [...existingPhotos, fileData]

      await supabase.from("projects").update({ project_photos: updatedPhotos }).eq("id", projectId)
    }

    console.log("[v0] Upload API - File uploaded successfully:", blob.url)
    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("[v0] Upload API - Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
