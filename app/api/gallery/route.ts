import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch projects that have photos and are marked as gallery items or completed
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, title, project_photos, description, created_at")
      .not("project_photos", "is", null)
      .in("status", ["completed", "gallery"])
      .order("created_at", { ascending: false })
      .limit(12) // Limit to 12 most recent gallery items

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch gallery images" }, { status: 500 })
    }

    // Transform project photos into gallery format
    const images =
      projects?.flatMap((project) => {
        const photos = project.project_photos as any[]
        return (
          photos?.map((photo, index) => ({
            id: `${project.id}-${photo.id || index}`,
            title: photo.title || project.title,
            url: photo.url,
            description: photo.description || project.description || `Photo from ${project.title}`,
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
