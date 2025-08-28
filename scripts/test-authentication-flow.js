console.log("[v0] Starting comprehensive authentication diagnostic...")

async function testAuthenticationFlow() {
  try {
    // Test environment variables
    console.log("[v0] Checking environment variables...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("[v0] ❌ Missing Supabase environment variables")
      console.log("[v0] SUPABASE_URL:", supabaseUrl ? "Present" : "Missing")
      console.log("[v0] SUPABASE_ANON_KEY:", supabaseKey ? "Present" : "Missing")
      return
    }

    console.log("[v0] ✅ Environment variables present")

    // Test database connection
    console.log("[v0] Testing database connection...")
    const response = await fetch("/api/admin/auth-debug")
    const debugData = await response.json()

    console.log("[v0] Auth debug response:", JSON.stringify(debugData, null, 2))

    // Check if users exist in database
    console.log("[v0] Checking for users in database...")
    const usersResponse = await fetch("/api/admin/users")

    if (usersResponse.ok) {
      const users = await usersResponse.json()
      console.log("[v0] Users found:", users.length || 0)
      if (users.length > 0) {
        console.log("[v0] Sample user:", users[0].email)
      }
    } else {
      console.log("[v0] ❌ Failed to fetch users:", usersResponse.status)
    }

    // Test Supabase auth directly
    console.log("[v0] Testing direct Supabase auth...")
    const testResponse = await fetch("/api/test-supabase-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword",
      }),
    })

    const testResult = await testResponse.json()
    console.log("[v0] Direct auth test:", JSON.stringify(testResult, null, 2))
  } catch (error) {
    console.log("[v0] ❌ Authentication diagnostic failed:", error.message)
  }
}

testAuthenticationFlow()
