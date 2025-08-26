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

    // Get maintenance reminders for the customer's projects
    const { data: reminders, error } = await supabase
      .from("maintenance_reminders")
      .select(`
        *,
        project:projects(
          id,
          title,
          customer_id
        )
      `)
      .eq("project.customer_id", user.id)
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching maintenance reminders:", error)
      return NextResponse.json({ error: "Failed to fetch maintenance reminders" }, { status: 500 })
    }

    // Format the data to match the interface
    const formattedReminders = (reminders || []).map((reminder) => ({
      id: reminder.id,
      projectId: reminder.project_id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.due_date,
      status: reminder.status,
    }))

    return NextResponse.json(formattedReminders)
  } catch (error) {
    console.error("Error in maintenance reminders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
