import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminUser() {
  try {
    console.log("Creating admin user...")

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@craftedflooringsolutions.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        role: "ADMIN",
        full_name: "Admin User",
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return
    }

    console.log("Admin user created in auth:", authData.user?.id)

    // Create user profile in database
    const { error: profileError } = await supabase.from("users").upsert({
      id: authData.user!.id,
      email: "admin@craftedflooringsolutions.com",
      full_name: "Admin User",
      role: "ADMIN",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      return
    }

    console.log("✅ Admin user created successfully!")
    console.log("Email: admin@craftedflooringsolutions.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("Error creating admin user:", error)
  }
}

createAdminUser()
