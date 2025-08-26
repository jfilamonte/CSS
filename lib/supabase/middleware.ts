import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { sessionManager } from "@/lib/session-manager"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
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

    const sessionState = await sessionManager.validateServerSession()

    console.log("[v0] Middleware - User:", sessionState.user?.email, "Path:", request.nextUrl.pathname)

    const protectedRoutes = ["/admin", "/admin-new", "/customer-portal", "/sales-dashboard"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !sessionState.isAuthenticated) {
      if (sessionState.error) {
        console.log("[v0] Session error:", sessionState.error)
        // Add error info to redirect URL for better user experience
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("error", "session_expired")
        url.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }

      console.log("[v0] Redirecting unauthenticated user to login")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    if (sessionState.isAuthenticated && sessionState.role) {
      const pathname = request.nextUrl.pathname
      const normalizedRole = sessionState.role.toLowerCase()

      // Admin routes
      if (pathname.startsWith("/admin") && !["admin", "super_admin"].includes(normalizedRole)) {
        console.log("[v0] Non-admin user trying to access admin area")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        url.searchParams.set("required_role", "admin")
        return NextResponse.redirect(url)
      }

      // Customer portal
      if (pathname.startsWith("/customer-portal") && normalizedRole !== "customer") {
        console.log("[v0] Non-customer trying to access customer portal")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        url.searchParams.set("required_role", "customer")
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
        url.searchParams.set("required_role", "sales")
        return NextResponse.redirect(url)
      }
    }

    supabaseResponse.headers.set("X-Session-Status", sessionState.isAuthenticated ? "authenticated" : "anonymous")
    if (sessionState.error) {
      supabaseResponse.headers.set("X-Session-Error", sessionState.error)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)

    const url = request.nextUrl.clone()
    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/customer-portal") ||
      request.nextUrl.pathname.startsWith("/sales-dashboard")
    ) {
      url.pathname = "/auth/login"
      url.searchParams.set("error", "system_error")
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }
}
