import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  return POST() // Reuse the same logic for GET requests
}

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current authenticated user from the request headers
    const authHeader =
      process.env.NODE_ENV === "development" ? "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY : undefined

    const targetEmail = "jfilamonte@herculessas.com" // The user trying to log in

    console.log("[v0] Syncing user:", targetEmail)

    // Check if user exists with this email but wrong ID
    const { data: emailUser, error: emailError } = await supabase
      .from("users")
      .select("*")
      .eq("email", targetEmail)
      .single()

    if (emailError && emailError.code !== "PGRST116") {
      console.log("[v0] Email lookup error:", emailError)
      return NextResponse.json({ error: "Email lookup error", details: emailError.message }, { status: 500 })
    }

    if (emailUser) {
      const correctAuthId = "b3d97e60-6453-4e9f-a673-ef0d910e5a49" // From debug data

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ id: correctAuthId })
        .eq("email", targetEmail)
        .select()
        .single()

      if (updateError) {
        console.log("[v0] Update error:", updateError)
        return NextResponse.json({ error: "Failed to sync user", details: updateError.message }, { status: 500 })
      }

      console.log("[v0] User synced successfully:", updatedUser)
      return NextResponse.json({ success: true, user: updatedUser, action: "updated" })
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch (error) {
    console.log("[v0] Sync error:", error)
    return NextResponse.json({ error: "Sync failed", details: error.message }, { status: 500 })
  }
}
