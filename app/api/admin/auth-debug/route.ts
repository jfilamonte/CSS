import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Auth Debug API - Starting diagnostic")

    const supabase = await createClient()

    // Get the current user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] Auth Debug - Auth error:", authError.message)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: authError.message,
          step: "auth.getUser()",
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("[v0] Auth Debug - No user found in session")
      return NextResponse.json(
        {
          error: "No user in session",
          step: "auth.getUser()",
        },
        { status: 401 },
      )
    }

    console.log("[v0] Auth Debug - User found:", user.email, "ID:", user.id)

    // Check if user exists in users table
    const { data: userRecord, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError) {
      console.log("[v0] Auth Debug - User table query error:", userError.message)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: userError.message,
          step: "users table query",
          userId: user.id,
          userEmail: user.email,
        },
        { status: 500 },
      )
    }

    if (!userRecord) {
      console.log("[v0] Auth Debug - No user record found in users table")
      return NextResponse.json(
        {
          error: "User not found in users table",
          step: "users table lookup",
          userId: user.id,
          userEmail: user.email,
          suggestion: "User exists in auth but not in users table - needs to be created",
        },
        { status: 404 },
      )
    }

    console.log("[v0] Auth Debug - User record found:", userRecord)

    // Return comprehensive diagnostic info
    return NextResponse.json({
      success: true,
      auth: {
        userId: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? true : false,
        lastSignIn: user.last_sign_in_at,
      },
      database: {
        userExists: true,
        role: userRecord.role,
        createdAt: userRecord.created_at,
        fullRecord: userRecord,
      },
      diagnosis: userRecord.role === "admin" ? "User should have admin access" : `User has role: ${userRecord.role}`,
    })
  } catch (error) {
    console.error("[v0] Auth Debug - Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
        step: "try/catch block",
      },
      { status: 500 },
    )
  }
}
