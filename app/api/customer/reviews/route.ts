import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer reviews
    const { data: reviews, error } = await supabase
      .from("customer_reviews")
      .select(`
        *,
        project:projects(
          id,
          title
        )
      `)
      .eq("customer_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    return NextResponse.json(reviews || [])
  } catch (error) {
    console.error("Error in reviews API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, rating, comment } = await request.json()

    // Insert new review
    const { data: review, error } = await supabase
      .from("customer_reviews")
      .insert({
        customer_id: user.id,
        project_id: projectId,
        rating,
        comment,
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating review:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error in review creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
