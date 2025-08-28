console.log("[v0] Starting admin user setup and authentication diagnostics...")

async function setupAdminUser() {
  try {
    // Test environment variables
    console.log("[v0] Checking environment variables...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log("[v0] ❌ Missing Supabase environment variables")
      console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Set" : "Missing")
      console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Missing")
      return
    }

    console.log("[v0] ✅ Environment variables are set")

    // Test database connection
    console.log("[v0] Testing database connection...")
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if users table exists and has data
    console.log("[v0] Checking users table...")
    const { data: users, error: usersError } = await supabase.from("users").select("*").limit(5)

    if (usersError) {
      console.log("[v0] ❌ Error querying users table:", usersError.message)
      return
    }

    console.log("[v0] ✅ Users table accessible")
    console.log("[v0] Found", users?.length || 0, "users in database")

    if (users && users.length > 0) {
      console.log("[v0] Existing users:")
      users.forEach((user) => {
        console.log(`[v0] - ${user.email} (${user.role})`)
      })
    }

    // Test authentication
    console.log("[v0] Testing Supabase Auth...")
    const { data: authData, error: authError } = await supabase.auth.getSession()

    if (authError) {
      console.log("[v0] ❌ Auth error:", authError.message)
    } else {
      console.log("[v0] ✅ Auth system accessible")
      console.log("[v0] Current session:", authData.session ? "Active" : "None")
    }

    // Check if we need to create an admin user
    const adminUsers = users?.filter((user) => user.role === "admin") || []

    if (adminUsers.length === 0) {
      console.log("[v0] ⚠️  No admin users found. Creating test admin user...")

      // Create test admin user
      const testEmail = "admin@craftedsurfacesolutions.com"
      const testPassword = "TestAdmin123!"

      console.log("[v0] Creating admin user with email:", testEmail)

      // First, try to sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })

      if (signUpError) {
        console.log("[v0] ❌ Error creating auth user:", signUpError.message)

        // If user already exists in auth but not in our users table, that's the issue
        if (signUpError.message.includes("already registered")) {
          console.log("[v0] User exists in auth but not in users table - this is the problem!")

          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          })

          if (signInData.user) {
            console.log("[v0] Found existing auth user, adding to users table...")

            // Add to users table
            const { error: insertError } = await supabase.from("users").insert({
              id: signInData.user.id,
              email: testEmail,
              role: "admin",
              created_at: new Date().toISOString(),
            })

            if (insertError) {
              console.log("[v0] ❌ Error adding user to users table:", insertError.message)
            } else {
              console.log("[v0] ✅ Successfully added user to users table")
            }
          }
        }
      } else if (signUpData.user) {
        console.log("[v0] ✅ Auth user created successfully")

        // Add to users table
        const { error: insertError } = await supabase.from("users").insert({
          id: signUpData.user.id,
          email: testEmail,
          role: "admin",
          created_at: new Date().toISOString(),
        })

        if (insertError) {
          console.log("[v0] ❌ Error adding user to users table:", insertError.message)
        } else {
          console.log("[v0] ✅ Successfully added user to users table")
        }
      }

      console.log("[v0] Test admin credentials:")
      console.log("[v0] Email:", testEmail)
      console.log("[v0] Password:", testPassword)
    } else {
      console.log("[v0] ✅ Admin users exist:", adminUsers.length)
    }

    // Test the auth debug endpoint
    console.log("[v0] Testing auth debug endpoint...")
    try {
      const response = await fetch("/api/admin/auth-debug")
      const debugData = await response.json()
      console.log("[v0] Auth debug response:", debugData)
    } catch (fetchError) {
      console.log("[v0] ❌ Error testing auth debug endpoint:", fetchError.message)
    }

    console.log("[v0] === SUMMARY ===")
    console.log("[v0] Environment variables: ✅")
    console.log("[v0] Database connection: ✅")
    console.log("[v0] Users in database:", users?.length || 0)
    console.log("[v0] Admin users:", adminUsers.length)
    console.log("[v0] Next step: Try logging in with the admin credentials above")
  } catch (error) {
    console.log("[v0] ❌ Setup failed:", error.message)
    console.log("[v0] Stack trace:", error.stack)
  }
}

setupAdminUser()
