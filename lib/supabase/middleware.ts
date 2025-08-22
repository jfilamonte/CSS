import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Check for auth token in cookies instead of using full Supabase client
  const authToken = request.cookies.get("sb-access-token") || request.cookies.get("supabase-auth-token")
  const hasAuth = !!authToken

  if (
    !hasAuth &&
    (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/customer-portal"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
