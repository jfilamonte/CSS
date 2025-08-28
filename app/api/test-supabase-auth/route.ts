import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Testing Supabase auth endpoint...")

    const { email, password } = await request.json()
    console.log("[v0] Test credentials:", { email, password: "***" })

    // Test server client creation
    const supabase = await createClient()
    console.log("[v0] Server client created successfully")

    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log("[v0] Current auth state:", { user: authData?.user?.email || "none", error: authError?.message })

    // Test database connection
    const { data: users, error: dbError } = await supabase.from("users").select("email, role").limit(1)

    console.log("[v0] Database test:", { users: users?.length || 0, error: dbError?.message })

    // Test sign in (if user exists)
    if (email && password) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Sign in test:", {
        success: !!signInData.user,
        user: signInData.user?.email,
        error: signInError?.message,
      })
    }

    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      auth: {
        currentUser: authData?.user?.email || null,
        authError: authError?.message || null,
      },
      database: {
        usersCount: users?.length || 0,
        dbError: dbError?.message || null,
      },
    })
  } catch (error) {
    console.log("[v0] ❌ Test endpoint error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
