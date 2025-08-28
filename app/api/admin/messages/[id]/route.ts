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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = params

    const { data: message, error } = await supabase.from("messages").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return NextResponse.json(message)
  } catch (error: any) {
    console.error("[v0] Message GET error:", error.message)
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = params
    const body = await request.json()

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("messages").update(updateData).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Message PATCH error:", error.message)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = params

    const { error } = await supabase.from("messages").delete().eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Message DELETE error:", error.message)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
