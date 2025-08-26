import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get project updates for the customer's projects
    const { data: updates, error } = await supabase
      .from("project_updates")
      .select(`
        *,
        project:projects(
          id,
          title,
          customer_id
        )
      `)
      .eq("project.customer_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching project updates:", error)
      return NextResponse.json({ error: "Failed to fetch project updates" }, { status: 500 })
    }

    return NextResponse.json(updates || [])
  } catch (error) {
    console.error("Error in project updates API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
