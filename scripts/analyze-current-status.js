console.log("[v0] Starting comprehensive system analysis...")

async function analyzeSystemStatus() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%2812%29-PquYtEt59l9HRpfRn0JIDTPr4Wd0AK.csv",
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
        const entry = {}
        headers.forEach((header, index) => {
          entry[header] = values[index] || ""
        })
        data.push(entry)
      }
    }

    console.log(`[v0] Parsed ${data.length} log entries`)

    // Analyze authentication status
    let authSuccessCount = 0
    let authFailureCount = 0
    let publicRouteCount = 0
    let adminRouteCount = 0
    let apiErrorCount = 0

    const pathAnalysis = {}
    const userAgentAnalysis = {}
    const statusCodeAnalysis = {}

    data.forEach((entry) => {
      const path = entry.requestPath || ""
      const userAgent = entry.requestUserAgent || ""
      const statusCode = entry.responseStatusCode || ""
      const message = entry.message || ""

      // Count path types
      pathAnalysis[path] = (pathAnalysis[path] || 0) + 1
      userAgentAnalysis[userAgent] = (userAgentAnalysis[userAgent] || 0) + 1
      statusCodeAnalysis[statusCode] = (statusCodeAnalysis[statusCode] || 0) + 1

      // Analyze authentication
      if (message.includes("Session valid: true")) {
        authSuccessCount++
      } else if (message.includes("Session valid: false") || message.includes("Auth Error")) {
        authFailureCount++
      }

      // Count route types
      if (path.includes("/admin")) {
        adminRouteCount++
      } else {
        publicRouteCount++
      }

      // Count API errors
      if (statusCode === "500" || message.includes("error") || message.includes("Error")) {
        apiErrorCount++
      }
    })

    console.log("\n[v0] === SYSTEM STATUS ANALYSIS ===")
    console.log(`[v0] Total requests analyzed: ${data.length}`)
    console.log(`[v0] Authentication successes: ${authSuccessCount}`)
    console.log(`[v0] Authentication failures: ${authFailureCount}`)
    console.log(`[v0] Public route requests: ${publicRouteCount}`)
    console.log(`[v0] Admin route requests: ${adminRouteCount}`)
    console.log(`[v0] API errors detected: ${apiErrorCount}`)

    console.log("\n[v0] === TOP REQUEST PATHS ===")
    Object.entries(pathAnalysis)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([path, count]) => {
        console.log(`[v0] ${path} [${count} requests]`)
      })

    console.log("\n[v0] === USER AGENTS ===")
    Object.entries(userAgentAnalysis)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([agent, count]) => {
        console.log(`[v0] ${agent} [${count} requests]`)
      })

    console.log("\n[v0] === STATUS CODES ===")
    Object.entries(statusCodeAnalysis)
      .sort(([, a], [, b]) => b - a)
      .forEach(([code, count]) => {
        console.log(`[v0] ${code} [${count} responses]`)
      })

    // Identify issues
    console.log("\n[v0] === IDENTIFIED ISSUES ===")

    if (authFailureCount > authSuccessCount) {
      console.log("[v0] ⚠️  More authentication failures than successes - check middleware")
    }

    if (apiErrorCount > 0) {
      console.log(`[v0] ⚠️  ${apiErrorCount} API errors detected - investigate endpoints`)
    }

    if (publicRouteCount === 0) {
      console.log("[v0] ⚠️  No public route access detected - middleware may be blocking everything")
    }

    // Check for Vercel services being blocked
    const vercelServices = Object.keys(userAgentAnalysis).filter(
      (agent) => agent.includes("vercel-") || agent.includes("v0bot"),
    )

    if (vercelServices.length > 0) {
      console.log("[v0] ℹ️  Vercel automated services detected:")
      vercelServices.forEach((service) => {
        console.log(`[v0]   - ${service} [${userAgentAnalysis[service]} requests]`)
      })
    }

    console.log("\n[v0] === RECOMMENDATIONS ===")

    if (authSuccessCount > 0) {
      console.log("[v0] ✅ Authentication is working for some requests")
    }

    if (publicRouteCount > 0) {
      console.log("[v0] ✅ Public routes are accessible")
    } else {
      console.log("[v0] 🔧 Fix middleware to allow public route access")
    }

    if (apiErrorCount > 0) {
      console.log("[v0] 🔧 Investigate and fix API endpoints returning errors")
    }

    console.log("[v0] Analysis complete!")
  } catch (error) {
    console.error("[v0] Error analyzing system status:", error)
  }
}

analyzeSystemStatus()
