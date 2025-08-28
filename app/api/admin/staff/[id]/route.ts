import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, supabase }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()

    const { data: staff, error } = await supabase.from("staff").select("*").eq("id", params.id).single()

    if (error) {
      console.error("[v0] Staff fetch error:", error.message)
      return NextResponse.json({ error: "Failed to fetch staff member" }, { status: 500 })
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error("[v0] Staff GET error:", error.message)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()

    const staffData = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      department: body.department,
      hire_date: body.hire_date,
      salary: body.salary,
      is_active: body.is_active,
      notes: body.notes,
      updated_at: new Date().toISOString(),
    }

    const { data: staff, error } = await supabase.from("staff").update(staffData).eq("id", params.id).select().single()

    if (error) {
      console.error("[v0] Staff update error:", error.message)
      return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 })
    }

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error("[v0] Staff PUT error:", error.message)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
