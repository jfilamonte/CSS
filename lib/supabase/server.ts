import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export function createServerClient() {
  return createClient()
}

export async function getSupabaseClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)

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

export function getSupabaseClientSync() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)

    console.log("[v0] Supabase client created successfully (sync)")
    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client (sync):", error)
    throw error
  }
}
