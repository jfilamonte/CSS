import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

  // Security headers
  supabaseResponse.headers.set("X-Frame-Options", "DENY")
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block")

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ["/admin", "/admin-new", "/sales-dashboard", "/customer-portal"]

  // API routes that require authentication
  const protectedApiRoutes = ["/api/admin", "/api/customer", "/api/notifications"]

  // Check if route requires protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute || isProtectedApiRoute) {
    // Get user from the response (set by updateSession)
    const userCookie = request.cookies.get("sb-access-token")

    if (!userCookie) {
      console.log("[v0] Middleware: No auth token, redirecting to login")

      if (isProtectedApiRoute) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Redirect to appropriate login page
      if (pathname.startsWith("/sales-dashboard")) {
        return NextResponse.redirect(new URL("/auth/sales-login", request.url))
      } else if (pathname.startsWith("/customer-portal")) {
        return NextResponse.redirect(new URL("/auth/customer-login", request.url))
      } else {
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }
  }

  // Log route access for monitoring
  if (process.env.NODE_ENV === "production") {
    console.log(`[v0] Route accessed: ${pathname}`)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
