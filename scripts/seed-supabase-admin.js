import { createClient } from "@supabase/supabase-js"

console.log("🔍 Checking environment variables...")
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Missing")
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Found" : "❌ Missing")
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Found" : "❌ Missing")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error(
    "❌ Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your environment variables.",
  )
  console.log("💡 You can set these in Project Settings > Environment Variables")
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase Service Role Key. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.",
  )
  console.log("💡 You can set this in Project Settings > Environment Variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminUser() {
  console.log("🌱 Creating Supabase admin user...")

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@craftedflooringsolutions.com"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

  try {
    // Create the admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: "ADMIN",
        first_name: "Admin",
        last_name: "User",
      },
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log(`ℹ️  Admin user already exists: ${adminEmail}`)
        return
      }
      throw authError
    }

    console.log(`✅ Created Supabase admin user: ${adminEmail}`)
    console.log(`🔑 Admin credentials: ${adminEmail} / ${adminPassword}`)

    // Insert user data into the users table
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: adminEmail,
      role: "ADMIN",
      first_name: "Admin",
      last_name: "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (dbError && !dbError.message.includes("duplicate key")) {
      console.error("❌ Error inserting user data:", dbError)
    } else {
      console.log("✅ Admin user data inserted into database")
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
    process.exit(1)
  }
}

createAdminUser()
  .then(() => {
    console.log("🎉 Supabase admin user setup complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Failed to create admin user:", error)
    process.exit(1)
  })
