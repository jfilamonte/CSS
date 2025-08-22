import { createClient } from "@/lib/supabase/server"

// Define types based on actual Supabase schema
export type Role = "admin" | "user" | "sales_rep"
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired"
export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold" | "cancelled"

export const prisma = {
  $disconnect: async () => {},
  // Add other methods as needed for compatibility
}

// Database helper functions using Supabase
export const db = {
  user: {
    async findByEmail(email: string) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase()).single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },

    async findById(id: string) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },

    async create(data: {
      email: string
      password_hash: string
      role?: Role
      first_name?: string
      last_name?: string
      phone?: string
    }) {
      const supabase = await createClient()
      const { data: result, error } = await supabase
        .from("users")
        .insert({
          ...data,
          email: data.email.toLowerCase(),
        })
        .select()
        .single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },

    async update(id: string, data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("users").update(data).eq("id", id).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  quote: {
    async findMany(filters?: {
      status?: QuoteStatus
      limit?: number
    }) {
      const supabase = await createClient()
      let query = supabase.from("quotes").select("*")

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async create(data: {
      customer_name: string
      customer_email: string
      customer_phone?: string
      project_type: string
      square_footage?: number
      project_address?: string
      message?: string
      status?: string
    }) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("quotes").insert(data).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  project: {
    async findMany(filters?: {
      status?: ProjectStatus
      limit?: number
    }) {
      const supabase = await createClient()
      let query = supabase.from("projects").select("*")

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async create(data: {
      title: string
      customer_id?: string
      square_footage?: number
      project_address?: string
      budget?: number
      status?: string
      progress_percentage?: number
    }) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("projects").insert(data).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },

    async update(id: string, data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("projects").update(data).eq("id", id).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },
}
