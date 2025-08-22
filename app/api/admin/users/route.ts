import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userProfile || !["admin", "ADMIN", "staff", "STAFF"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userProfile || !["admin", "ADMIN"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Create user profile in database
    const { error: profileError } = await supabase.from("users").insert({
      id: newUser.user.id,
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
      is_active: true,
    })

    if (profileError) {
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json({ message: "User created successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
