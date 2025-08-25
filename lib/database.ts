import { createClient } from "@/lib/supabase/server"

// Define types based on actual Supabase schema
export type Role = "admin" | "user" | "sales_rep"
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired"
export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold" | "cancelled"

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

    async findMany(filters: any, options?: { orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("users").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
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

    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("quotes").select("*, customer:users(*), lead:leads(*)")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
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

    async update(id: string, data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("quotes").update(data).eq("id", id).select().single()

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

    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("projects").select("*, customer:users(*), quote:quotes(*)")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
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

  notifications: {
    async findMany(filters: any, options?: { orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("notifications").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async create(data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("notifications").insert(data).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },

    async updateMany(filters: any, data: any) {
      const supabase = await createClient()
      let query = supabase.from("notifications").update(data)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === "id" && value && typeof value === "object" && "in" in value) {
          // Handle "in" operator for multiple IDs
          query = query.in("id", value.in)
        } else if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      const { error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return false
      }
      return true
    },
  },

  appointments: {
    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any }) {
      const supabase = await createClient()
      let query = supabase.from("appointments").select("*, staff:users(*)")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async create(data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("appointments").insert(data).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  invoices: {
    async findMany(filters: any, options?: { orderBy?: any }) {
      const supabase = await createClient()
      let query = supabase.from("invoices").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async findFirst(filters: any, options?: { include?: any }) {
      const supabase = await createClient()
      let query = supabase.from("invoices").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query.single()
      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },

    async update(id: string, data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("invoices").update(data).eq("id", id).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  leads: {
    async findMany(filters?: any) {
      const supabase = await createClient()
      let query = supabase.from("leads").select("*")

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value)
          }
        })
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("leads").select("*, user:users(*)")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },
  },

  documents: {
    async findMany(filters: any, options?: { orderBy?: any }) {
      const supabase = await createClient()
      let query = supabase.from("documents").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },
  },

  projectPhotos: {
    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any }) {
      const supabase = await createClient()
      let query = supabase.from("project_photos").select("*, project:projects(*)")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }

      // Filter by project customer if specified in join options
      if (options?.join?.project?.where?.customerId) {
        const customerId = options.join.project.where.customerId
        return (data || []).filter((photo) => photo.project?.customerId === customerId)
      }

      return data || []
    },
  },

  payments: {
    async create(data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("payments").insert(data).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  messages: {
    async findManyWithJoin(filters: any, options?: { join?: any; orderBy?: any; limit?: number }) {
      const supabase = await createClient()
      let query = supabase.from("messages").select("*, sender:users(*)")

      // Handle complex filtering for messages
      if (filters.userId) {
        // Messages where user is sender or recipient
        query = query.or(`sender_id.eq.${filters.userId},recipient_id.eq.${filters.userId}`)
      }

      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId)
      }

      if (filters.recipientId) {
        // Messages between specific users
        query = query.or(
          `and(sender_id.eq.${filters.userId},recipient_id.eq.${filters.recipientId}),and(sender_id.eq.${filters.recipientId},recipient_id.eq.${filters.userId})`,
        )
      }

      if (options?.orderBy) {
        const [field, direction] = Object.entries(options.orderBy)[0]
        query = query.order(field, { ascending: direction === "asc" })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async createWithJoin(data: any) {
      const supabase = await createClient()
      const { data: result, error } = await supabase.from("messages").insert(data).select("*, sender:users(*)").single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return result
    },
  },

  siteSettings: {
    async findFirst(filters: any) {
      const supabase = await createClient()
      let query = supabase.from("site_settings").select("*")

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query.single()
      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },
  },
}
