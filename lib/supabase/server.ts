import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    const cookieStore = await cookies()

    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    if (!client) {
      console.error("[v0] Failed to create Supabase client")
      throw new Error("Failed to create Supabase client")
    }

    console.log("[v0] Supabase client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw error
  }
}

export { createServerClient }
