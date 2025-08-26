import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - User:", user?.email, "Path:", request.nextUrl.pathname)

  // Protected routes that require authentication
  const protectedRoutes = ["/admin", "/admin-new", "/customer-portal", "/sales-dashboard"]

  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && (!user || error)) {
    console.log("[v0] Redirecting unauthenticated user to login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user && !error) {
    try {
      const { data: userData } = await supabase.from("users").select("role").eq("email", user.email).single()

      if (userData) {
        const normalizedRole = userData.role?.toLowerCase()
        const pathname = request.nextUrl.pathname

        // Admin routes
        if (pathname.startsWith("/admin") && !["admin", "super_admin"].includes(normalizedRole)) {
          console.log("[v0] Non-admin user trying to access admin area")
          const url = request.nextUrl.clone()
          url.pathname = "/unauthorized"
          return NextResponse.redirect(url)
        }

        // Customer portal
        if (pathname.startsWith("/customer-portal") && normalizedRole !== "customer") {
          console.log("[v0] Non-customer trying to access customer portal")
          const url = request.nextUrl.clone()
          url.pathname = "/unauthorized"
          return NextResponse.redirect(url)
        }

        // Sales dashboard
        if (
          pathname.startsWith("/sales-dashboard") &&
          !["staff", "admin", "sales_person", "salesperson"].includes(normalizedRole)
        ) {
          console.log("[v0] Unauthorized user trying to access sales dashboard")
          const url = request.nextUrl.clone()
          url.pathname = "/unauthorized"
          return NextResponse.redirect(url)
        }
      }
    } catch (dbError) {
      console.error("[v0] Database error in middleware:", dbError)
    }
  }

  return supabaseResponse
}
