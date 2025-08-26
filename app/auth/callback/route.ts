import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user data and check role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get user profile to check role
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (profile?.role?.toLowerCase() === "admin" || profile?.role?.toLowerCase() === "super_admin") {
          return NextResponse.redirect(`${origin}/admin-new`)
        } else {
          return NextResponse.redirect(`${origin}/customer-portal`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
