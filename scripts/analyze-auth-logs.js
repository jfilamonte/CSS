// Log Analysis Script for Authentication Issues
// Fetches and analyzes CSV log data to identify authentication problems

async function analyzeAuthLogs() {
  console.log("[v0] Starting authentication log analysis...")

  try {
    // Fetch the CSV log data
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%286%29-dL2bhhxTMuEH7G9jEpmCdYQNaD7jnH.csv",
    )
    const csvText = await response.text()

    console.log("[v0] CSV data fetched successfully")

    // Parse CSV data
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")
    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",")
        const row = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ""
        })
        data.push(row)
      }
    }

    console.log(`[v0] Parsed ${data.length} log entries`)

    // Analyze authentication patterns
    const authIssues = {
      sessionExpired: 0,
      redirects: 0,
      adminPaths: new Set(),
      errorMessages: new Set(),
      statusCodes: {},
    }

    data.forEach((entry) => {
      // Count session expired errors
      if (entry.requestQueryString && entry.requestQueryString.includes("session_expired")) {
        authIssues.sessionExpired++
      }

      // Count redirects
      if (entry.responseStatusCode === "307") {
        authIssues.redirects++
      }

      // Track admin paths being accessed
      if (entry.requestPath && entry.requestPath.includes("/admin-new")) {
        authIssues.adminPaths.add(entry.requestPath)
      }

      // Track error messages
      if (entry.message && entry.message.includes("[v0]")) {
        authIssues.errorMessages.add(entry.message)
      }

      // Track status codes
      const statusCode = entry.responseStatusCode
      if (statusCode) {
        authIssues.statusCodes[statusCode] = (authIssues.statusCodes[statusCode] || 0) + 1
      }
    })

    // Generate analysis report
    console.log("\n=== AUTHENTICATION ANALYSIS REPORT ===")
    console.log(`Total log entries: ${data.length}`)
    console.log(`Session expired errors: ${authIssues.sessionExpired}`)
    console.log(`Total redirects (307): ${authIssues.redirects}`)
    console.log(`Admin paths accessed: ${authIssues.adminPaths.size}`)

    console.log("\nAdmin paths being blocked:")
    authIssues.adminPaths.forEach((path) => {
      console.log(`  - ${path}`)
    })

    console.log("\nStatus code distribution:")
    Object.entries(authIssues.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count} requests`)
    })

    console.log("\nError messages found:")
    authIssues.errorMessages.forEach((msg) => {
      console.log(`  - ${msg}`)
    })

    // Identify the main issue
    console.log("\n=== DIAGNOSIS ===")
    if (authIssues.sessionExpired > 0) {
      console.log("❌ ISSUE: Sessions are expiring, causing redirects to login")
      console.log("💡 SOLUTION: Fix session persistence in middleware")
    }

    if (authIssues.redirects > authIssues.sessionExpired) {
      console.log("❌ ISSUE: More redirects than session errors - middleware blocking access")
      console.log("💡 SOLUTION: Check role validation logic in middleware")
    }

    console.log("\n=== RECOMMENDED FIXES ===")
    console.log("1. Fix session cookie persistence in middleware")
    console.log("2. Ensure proper role validation for admin users")
    console.log("3. Add better error handling for authentication failures")
  } catch (error) {
    console.error("[v0] Error analyzing logs:", error)
  }
}

// Run the analysis
analyzeAuthLogs()
