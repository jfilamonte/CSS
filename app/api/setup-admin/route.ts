import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find((user) => user.email === "admin@craftedflooringsolutions.com")

    let userId: string

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id
      console.log("Admin user already exists, updating profile...")
    } else {
      // Create new admin user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: "admin@craftedflooringsolutions.com",
        password: "admin123",
        email_confirm: true,
        user_metadata: {
          role: "ADMIN",
          first_name: "Admin",
          last_name: "User",
        },
      })

      if (authError) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Failed to create auth user", details: authError.message }, { status: 500 })
      }

      userId = authData.user.id
    }

    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: userId,
      email: "admin@craftedflooringsolutions.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin", // Try lowercase admin
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { error: "Failed to create user profile", details: profileError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: existingUser ? "Admin user profile updated successfully" : "Admin user created successfully",
      credentials: {
        email: "admin@craftedflooringsolutions.com",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed", details: error.message }, { status: 500 })
  }
}
