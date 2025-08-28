console.log("[v0] Checking database users and authentication setup...")

async function checkDatabaseUsers() {
  try {
    // Fetch from the admin API to check users
    const response = await fetch("https://craftedsurfacesolutions.com/api/admin/auth-debug")
    const data = await response.json()

    console.log("[v0] Auth debug response:", JSON.stringify(data, null, 2))

    // Also check if we can create a test user
    console.log("[v0] Checking if we need to create admin user...")

    // Check environment variables
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@craftedsurfacesolutions.com"
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

    console.log("[v0] Admin credentials configured:")
    console.log("[v0] Email:", adminEmail)
    console.log("[v0] Password length:", adminPassword.length)
  } catch (error) {
    console.error("[v0] Error checking database users:", error)
  }
}

checkDatabaseUsers()
