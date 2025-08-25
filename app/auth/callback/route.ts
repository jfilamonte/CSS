import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user data and check role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get user profile to check role
        const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

        // Redirect based on role
        if (profile?.role === "ADMIN" || profile?.role === "admin") {
          return NextResponse.redirect(`${origin}/admin`)
        } else {
          return NextResponse.redirect(`${origin}/customer`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
