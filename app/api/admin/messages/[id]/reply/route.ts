import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  // Get user role
  const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userError || userData?.role !== "admin") {
    throw new Error("Admin access required")
  }

  return { user, supabase }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = params
    const { reply } = await request.json()

    // Get the original message
    const { data: message, error: messageError } = await supabase.from("messages").select("*").eq("id", id).single()

    if (messageError) {
      throw messageError
    }

    // Here you would typically send an email using a service like Resend
    // For now, we'll just simulate the reply functionality
    console.log(`[v0] Sending reply to ${message.email}: ${reply}`)

    // Update message status to replied
    const { error: updateError } = await supabase
      .from("messages")
      .update({
        status: "replied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Message reply error:", error.message)
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
  }
}
