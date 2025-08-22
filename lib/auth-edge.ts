import { createClient } from "@/lib/supabase/client"

export async function verifyAuthEdge(token?: string): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { success: false, error: "Authentication failed" }
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name")
      .eq("email", user.email)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User data not found" }
    }

    return { success: true, user: userData }
  } catch (error) {
    console.error("Edge auth verification error:", error)
    return { success: false, error: "Authentication verification failed" }
  }
}
