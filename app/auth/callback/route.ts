import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { ROLES } from "@/lib/auth-utils"

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

        const userRole = profile?.role?.toLowerCase()

        if (userRole === ROLES.ADMIN) {
          return NextResponse.redirect(`${origin}/admin`)
        } else if (userRole === ROLES.CUSTOMER) {
          return NextResponse.redirect(`${origin}/customer-portal`)
        } else if (userRole === ROLES.STAFF || userRole === ROLES.SALES_REP) {
          return NextResponse.redirect(`${origin}/sales-dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/auth/login`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
