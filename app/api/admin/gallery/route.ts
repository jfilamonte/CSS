import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, title, project_photos, created_at")
      .not("project_photos", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
    }

    const images =
      projects?.flatMap((project) => {
        const photos = project.project_photos as any[]
        return (
          photos?.map((photo) => ({
            id: `${project.id}-${photo.id || Math.random()}`,
            title: photo.title || project.title,
            url: photo.url,
            description: photo.description || `Photo from ${project.title}`,
            project_id: project.id,
            created_at: project.created_at,
          })) || []
        )
      }) || []

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Gallery API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, url, project_id } = body

    if (project_id) {
      // Add to existing project
      const { data: project } = await supabase.from("projects").select("project_photos").eq("id", project_id).single()

      const existingPhotos = (project?.project_photos as any[]) || []
      const newPhoto = {
        id: Date.now().toString(),
        title,
        description,
        url,
        uploaded_at: new Date().toISOString(),
      }

      const { data: updatedProject, error } = await supabase
        .from("projects")
        .update({ project_photos: [...existingPhotos, newPhoto] })
        .eq("id", project_id)
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: "Failed to save image" }, { status: 500 })
      }

      return NextResponse.json({ image: newPhoto, project: updatedProject })
    } else {
      // Create a new gallery project
      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          title: title || "Gallery Image",
          description: description || "Gallery image",
          customer_id: user.id, // Use admin user as customer for gallery items
          status: "gallery",
          project_photos: [
            {
              id: Date.now().toString(),
              title,
              description,
              url,
              uploaded_at: new Date().toISOString(),
            },
          ],
        })
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: "Failed to save image" }, { status: 500 })
      }

      return NextResponse.json({ image: newProject.project_photos[0], project: newProject })
    }
  } catch (error) {
    console.error("Gallery POST API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
