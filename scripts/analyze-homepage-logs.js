console.log("[v0] Starting homepage access log analysis...")

async function analyzeHomepageLogs() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%289%29-Ck6rAeDPzMCr9E5SksYjDV2Ov8Un3u.csv",
    )
    const csvText = await response.text()
    console.log("[v0] CSV data fetched successfully")

    // Parse CSV data
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")
    const logs = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",")
        const logEntry = {}
        headers.forEach((header, index) => {
          logEntry[header] = values[index] || ""
        })
        logs.push(logEntry)
      }
    }

    console.log(`[v0] Parsed ${logs.length} log entries`)

    // Analyze homepage access patterns
    const homepageRequests = logs.filter(
      (log) =>
        log.requestPath && (log.requestPath.endsWith("/") || log.requestPath.includes("v0-epoxy-flooring-website")),
    )

    const vercelScreenshots = logs.filter(
      (log) => log.requestUserAgent && log.requestUserAgent.includes("vercel-screenshot"),
    )

    const authErrors = logs.filter((log) => log.message && log.message.includes("Auth session missing!"))

    const publicRoutes = logs.filter(
      (log) => log.requestPath && !log.requestPath.includes("/admin") && !log.requestPath.includes("/auth"),
    )

    console.log("\n[v0] === HOMEPAGE ACCESS ANALYSIS ===")
    console.log(`[v0] Total homepage requests: ${homepageRequests.length}`)
    console.log(`[v0] Vercel screenshot requests: ${vercelScreenshots.length}`)
    console.log(`[v0] Auth session missing errors: ${authErrors.length}`)
    console.log(`[v0] Public route requests: ${publicRoutes.length}`)

    // Check if middleware is blocking public routes
    const blockedPublicRoutes = publicRoutes.filter(
      (log) => log.message && log.message.includes("Auth session missing!"),
    )

    console.log("\n[v0] === MIDDLEWARE CONFIGURATION ISSUES ===")
    if (blockedPublicRoutes.length > 0) {
      console.log(`[v0] ⚠️  Middleware is incorrectly blocking ${blockedPublicRoutes.length} public routes`)
      console.log("[v0] Public routes being blocked:")
      blockedPublicRoutes.forEach((log) => {
        console.log(`[v0] - ${log.requestPath} (${log.requestUserAgent})`)
      })
    } else {
      console.log("[v0] ✅ Middleware is correctly allowing public routes")
    }

    // Analyze response codes
    const responseCodes = {}
    logs.forEach((log) => {
      const code = log.responseStatusCode || "unknown"
      responseCodes[code] = (responseCodes[code] || 0) + 1
    })

    console.log("\n[v0] === RESPONSE CODE ANALYSIS ===")
    Object.entries(responseCodes).forEach(([code, count]) => {
      console.log(`[v0] ${code}: ${count} requests`)
    })

    console.log("\n[v0] === RECOMMENDATIONS ===")
    if (blockedPublicRoutes.length > 0) {
      console.log("[v0] 1. Fix middleware to allow public routes (/, /about, /services, /gallery, /contact)")
      console.log("[v0] 2. Only protect admin routes (/admin-new/*, /admin/*)")
      console.log("[v0] 3. Allow Vercel screenshot service to access homepage")
    } else {
      console.log("[v0] 1. Middleware configuration appears correct")
      console.log("[v0] 2. Continue monitoring for any access issues")
    }
  } catch (error) {
    console.error("[v0] Error analyzing homepage logs:", error)
  }
}

analyzeHomepageLogs()
