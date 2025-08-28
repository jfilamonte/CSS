import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Parse project ID and photo ID from composite ID (format: "projectId-photoId")
    const [projectId, photoId] = imageId.split("-")

    if (!projectId) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
    }

    // Get the project and remove the specific photo
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("project_photos")
      .eq("id", projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const photos = (project.project_photos as any[]) || []
    const updatedPhotos = photos.filter((photo) => photo.id !== photoId)

    // Update project with filtered photos
    const { error: updateError } = await supabase
      .from("projects")
      .update({ project_photos: updatedPhotos })
      .eq("id", projectId)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gallery DELETE API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "ADMIN", "staff", "STAFF"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const imageId = params.id
    const updates = await request.json()

    // Parse project ID and photo ID from composite ID
    const [projectId, photoId] = imageId.split("-")

    if (!projectId) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
    }

    // Get the project and update the specific photo
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("project_photos")
      .eq("id", projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const photos = (project.project_photos as any[]) || []
    const updatedPhotos = photos.map((photo) =>
      photo.id === photoId ? { ...photo, ...updates, updated_at: new Date().toISOString() } : photo,
    )

    // Update project with modified photos
    const { error: updateError } = await supabase
      .from("projects")
      .update({ project_photos: updatedPhotos })
      .eq("id", projectId)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to update image" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gallery PATCH API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
