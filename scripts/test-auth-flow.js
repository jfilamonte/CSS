import { createClient } from "../lib/supabase/server.js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔍 Starting Authentication Diagnostic...\n")

// Test 1: Environment Variables
console.log("1. Testing Environment Variables:")
console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Present" : "❌ Missing")
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Present" : "❌ Missing")

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Missing required environment variables")
  process.exit(1)
}

const supabase = await createClient()

// Test 2: Database Connection
console.log("\n2. Testing Database Connection:")
try {
  const { data, error } = await supabase.from("users").select("count").limit(1)
  if (error) {
    console.log("❌ Database connection failed:", error.message)
  } else {
    console.log("✅ Database connection successful")
  }
} catch (err) {
  console.log("❌ Database connection error:", err.message)
}

// Test 3: Check for admin users
console.log("\n3. Checking for Admin Users:")
try {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, role")
    .ilike("role", "%admin%")
    .limit(5)

  if (error) {
    console.log("❌ Error fetching admin users:", error.message)
  } else if (users && users.length > 0) {
    console.log("✅ Found admin users:")
    users.forEach((user) => {
      console.log(`  - ${user.email} (role: ${user.role})`)
    })
  } else {
    console.log("⚠️  No admin users found in database")
  }
} catch (err) {
  console.log("❌ Error checking admin users:", err.message)
}

// Test 4: Test Authentication with a known email
console.log("\n4. Testing Authentication Flow:")
const testEmail = "jfilamonte@herculessas.com" // From your screenshot

try {
  const { data: user, error } = await supabase.from("users").select("*").eq("email", testEmail).single()

  if (error) {
    console.log(`❌ User lookup failed for ${testEmail}:`, error.message)
  } else if (user) {
    console.log(`✅ Found user: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.is_active}`)

    // Test role normalization
    const normalizedRole = user.role?.toLowerCase().trim()
    const isAdmin = ["admin", "super_admin", "administrator"].includes(normalizedRole)
    console.log(`   Normalized role: ${normalizedRole}`)
    console.log(`   Is admin: ${isAdmin ? "✅" : "❌"}`)
  } else {
    console.log(`⚠️  User ${testEmail} not found in database`)
  }
} catch (err) {
  console.log("❌ User lookup error:", err.message)
}

// Test 5: Test Supabase Auth
console.log("\n5. Testing Supabase Auth Service:")
try {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.log("❌ Auth service error:", error.message)
  } else {
    console.log("✅ Auth service accessible")
    console.log("Current session:", data.session ? "Active" : "None")
  }
} catch (err) {
  console.log("❌ Auth service error:", err.message)
}

console.log("\n🏁 Diagnostic Complete!")
console.log("\nIf you see any ❌ errors above, those are the issues preventing login.")
