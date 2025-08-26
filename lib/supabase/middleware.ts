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
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              })
            })
          },
        },
      },
    )

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.log("[v0] Session error:", sessionError.message)
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log(
      "[v0] Middleware - User:",
      user?.email,
      "Path:",
      request.nextUrl.pathname,
      "Session valid:",
      !!session,
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
      if (authError?.message?.includes("session") || sessionError) {
        url.searchParams.set("error", "session_expired")
      }
      return NextResponse.redirect(url)
    }

    if (user) {
      let userData = null
      let roleError = null

      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await supabase.from("users").select("role").eq("email", user.email).single()

        userData = result.data
        roleError = result.error

        if (!roleError) break

        console.log(`[v0] Role lookup attempt ${attempt + 1} failed:`, roleError.message)
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100)) // Brief retry delay
        }
      }

      if (roleError) {
        console.error("[v0] Role lookup failed after retries:", roleError)
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        url.searchParams.set("error", "role_error")
        url.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }

      const userRole = userData?.role?.toLowerCase()
      console.log("[v0] User role:", userRole, "for", user.email)

      const pathname = request.nextUrl.pathname

      if (pathname.startsWith("/admin") && !["admin", "super_admin"].includes(userRole)) {
        console.log("[v0] Access denied: User", user.email, "with role", userRole, "cannot access admin area")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        url.searchParams.set("required_role", "admin")
        return NextResponse.redirect(url)
      }

      if (pathname.startsWith("/customer-portal") && userRole !== "customer") {
        console.log("[v0] Access denied: User", user.email, "with role", userRole, "cannot access customer portal")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        url.searchParams.set("required_role", "customer")
        return NextResponse.redirect(url)
      }

      if (
        pathname.startsWith("/sales-dashboard") &&
        !["staff", "admin", "sales_person", "salesperson"].includes(userRole)
      ) {
        console.log("[v0] Access denied: User", user.email, "with role", userRole, "cannot access sales dashboard")
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        url.searchParams.set("required_role", "sales")
        return NextResponse.redirect(url)
      }
    }

    supabaseResponse.headers.set("X-Session-Status", user ? "authenticated" : "anonymous")
    supabaseResponse.headers.set("X-User-Role", user ? "verified" : "none")

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware critical error:", error)

    const url = request.nextUrl.clone()
    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/customer-portal") ||
      request.nextUrl.pathname.startsWith("/sales-dashboard")
    ) {
      url.pathname = "/auth/login"
      url.searchParams.set("error", "system_error")
      url.searchParams.set("redirect", request.nextUrl.pathname)
      url.searchParams.set("details", error instanceof Error ? error.message : "unknown_error")
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }
}
