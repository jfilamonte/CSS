import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Testing Supabase authentication...")

    // Test 1: Can we create a Supabase client?
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    // Test 2: Can we connect to the database?
    const { data: testQuery, error: dbError } = await supabase.from("users").select("count").limit(1)

    if (dbError) {
      console.log("[v0] Database connection error:", dbError.message)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Database connection successful")

    // Test 3: Check if any users exist
    const { data: users, error: usersError } = await supabase.from("users").select("id, email, role").limit(5)

    if (usersError) {
      console.log("[v0] Users query error:", usersError.message)
      return NextResponse.json(
        {
          error: "Users query failed",
          details: usersError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Found users:", users?.length || 0)

    // Test 4: Try to create a test user
    const testEmail = "admin@craftedsurfacesolutions.com"
    const testPassword = "TestPassword123!"

    console.log("[v0] Attempting to create test user...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (authError) {
      console.log("[v0] Auth signup error:", authError.message)
      // This might be expected if user already exists
    } else {
      console.log("[v0] Test user created or already exists")
    }

    return NextResponse.json({
      success: true,
      database_connected: true,
      users_found: users?.length || 0,
      test_user_email: testEmail,
      auth_error: authError?.message || null,
      message: "Supabase authentication test completed",
    })
  } catch (error) {
    console.log("[v0] Test failed with error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
