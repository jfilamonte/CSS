import { createClient } from "@/lib/supabase/server"

export const prisma = {
  user: {
    async update(params: { where: { id: string }; data: any }) {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("users")
        .update(params.data)
        .eq("id", params.where.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    async findMany(params?: any) {
      const supabase = await createClient()
      let query = supabase.from("users").select("*")

      if (params?.where?.role) {
        query = query.eq("role", params.where.role)
      }
      if (params?.orderBy) {
        const orderField = Object.keys(params.orderBy)[0]
        const orderDirection = params.orderBy[orderField] === "desc" ? false : true
        query = query.order(orderField, { ascending: orderDirection })
      }
      if (params?.take) {
        query = query.limit(params.take)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  },
  notification: {
    async findMany(params?: any) {
      const supabase = await createClient()
      let query = supabase.from("email_notifications").select("*")

      if (params?.where) {
        Object.entries(params.where).forEach(([key, value]) => {
          if (key !== "created_at") {
            query = query.eq(key, value)
          }
        })
      }
      if (params?.orderBy) {
        const orderField = Object.keys(params.orderBy)[0]
        const orderDirection = params.orderBy[orderField] === "desc" ? false : true
        query = query.order(orderField, { ascending: orderDirection })
      }
      if (params?.take) {
        query = query.limit(params.take)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    async create(params: { data: any }) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("email_notifications").insert(params.data).select().single()

      if (error) throw error
      return data
    },
    async updateMany(params: { where: any; data: any }) {
      const supabase = await createClient()
      let query = supabase.from("email_notifications").update(params.data)

      Object.entries(params.where).forEach(([key, value]) => {
        if (key === "id" && Array.isArray(value.in)) {
          query = query.in("id", value.in)
        } else {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query
      if (error) throw error
      return data
    },
  },
  message: {
    async findMany(params?: any) {
      const supabase = await createClient()
      let query = supabase.from("messages").select("*")

      if (params?.where) {
        Object.entries(params.where).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      if (params?.orderBy) {
        const orderField = Object.keys(params.orderBy)[0]
        const orderDirection = params.orderBy[orderField] === "desc" ? false : true
        query = query.order(orderField, { ascending: orderDirection })
      }
      if (params?.take) {
        query = query.limit(params.take)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    async create(params: { data: any; include?: any }) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("messages").insert(params.data).select().single()

      if (error) throw error
      return data
    },
  },
  siteSettings: {
    async findFirst(params?: any) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("business_settings").select("*").limit(1).single()

      if (error) return null
      return data
    },
  },
  $disconnect: async () => {},
}

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

    async create(userData: any) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("users").insert(userData).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },

    async update(id: string, userData: any) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("users").update(userData).eq("id", id).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },
  },

  appointments: {
    async findMany(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("appointments").select("*")

      if (filters.customer_id) {
        query = query.eq("customer_id", filters.customer_id)
      }

      const { data, error } = await query.order("scheduled_date", { ascending: true })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async create(appointmentData: any) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("appointments").insert(appointmentData).select().single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },
  },

  invoices: {
    async findMany(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("invoices").select("*")

      if (filters.customer_id) {
        query = query.eq("customer_id", filters.customer_id)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async findFirst(filters: any) {
      const supabase = await createClient()
      let query = supabase.from("invoices").select("*")

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.single()

      if (error) {
        console.warn("Database operation failed:", error)
        return null
      }
      return data
    },
  },

  quotes: {
    async findMany(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("quotes").select("*")

      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async count(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("quotes").select("*", { count: "exact", head: true })

      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      const { count, error } = await query

      if (error) {
        console.warn("Database operation failed:", error)
        return 0
      }
      return count || 0
    },
  },

  projects: {
    async findMany(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("projects").select("*")

      if (filters.customer_id) {
        query = query.eq("customer_id", filters.customer_id)
      }
      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.warn("Database operation failed:", error)
        return []
      }
      return data || []
    },

    async count(filters: any = {}) {
      const supabase = await createClient()
      let query = supabase.from("projects").select("*", { count: "exact", head: true })

      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      const { count, error } = await query

      if (error) {
        console.warn("Database operation failed:", error)
        return 0
      }
      return count || 0
    },
  },
}
