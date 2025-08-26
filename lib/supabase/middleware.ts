import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log(
      "[v0] Middleware - User:",
      user?.email,
      "Path:",
      request.nextUrl.pathname,
      "Auth Error:",
      authError?.message,
    )

    const protectedRoutes = ["/admin", "/admin-new", "/customer-portal", "/sales-dashboard"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && (!user || authError)) {
      console.log("[v0] Redirecting unauthenticated user to login", authError?.message)
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    if (user) {
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single()

      if (roleError) {
        console.error("[v0] Role lookup error:", roleError)
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("error", "role_error")
        return NextResponse.redirect(url)
      }

      const userRole = userData?.role?.toLowerCase()
      console.log("[v0] User role:", userRole, "for", user.email)

      const pathname = request.nextUrl.pathname

      // Admin routes
      if (pathname.startsWith("/admin") && !["admin", "super_admin"].includes(userRole)) {
        console.log("[v0] Non-admin user trying to access admin area")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }

      // Customer portal
      if (pathname.startsWith("/customer-portal") && userRole !== "customer") {
        console.log("[v0] Non-customer trying to access customer portal")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }

      // Sales dashboard
      if (
        pathname.startsWith("/sales-dashboard") &&
        !["staff", "admin", "sales_person", "salesperson"].includes(userRole)
      ) {
        console.log("[v0] Unauthorized user trying to access sales dashboard")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }
    }

    supabaseResponse.headers.set("X-Session-Status", user ? "authenticated" : "anonymous")

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
