import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Current auth user:", user?.id, user?.email)
    console.log("[v0] Auth error:", authError)

    // Get all users from database
    const { data: allUsers, error: dbError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role, created_at")

    console.log("[v0] Database users:", allUsers)
    console.log("[v0] Database error:", dbError)

    // Check if admin user exists
    const adminUser = allUsers?.find((u) => u.email === "admin@craftedflooringsolutions.com")
    console.log("[v0] Admin user found:", adminUser)

    return NextResponse.json({
      currentAuthUser: user ? { id: user.id, email: user.email } : null,
      authError,
      databaseUsers: allUsers,
      dbError,
      adminUserExists: !!adminUser,
      adminUserData: adminUser,
    })
  } catch (error) {
    console.error("[v0] Debug API error:", error)
    return NextResponse.json({ error: "Debug failed", details: error.message }, { status: 500 })
  }
}
