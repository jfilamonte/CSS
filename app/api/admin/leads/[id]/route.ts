import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status } = await request.json()
    const leadId = params.id

    const { data: updatedLead, error } = await supabase
      .from("quotes")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    console.error("Update lead error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, notes } = await request.json()
    const leadId = params.id

    const { data: updatedLead, error } = await supabase
      .from("quotes")
      .update({
        ...(status && { status }),
        ...(notes && { notes }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ lead: updatedLead })
  } catch (error) {
    console.error("Update lead error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadId = params.id

    const { error } = await supabase.from("quotes").delete().eq("id", leadId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete lead error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
