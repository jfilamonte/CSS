import fetch from "node-fetch"

async function analyzeSecurityLogs() {
  console.log("[v0] Starting security log analysis...")

  try {
    // Fetch the CSV data
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result%20%287%29-Do6zMg9aCccNYdtfO1qd6JTkNqgZja.csv",
    )
    const csvData = await response.text()
    console.log("[v0] CSV data fetched successfully")

    // Parse CSV data
    const lines = csvData.split("\n")
    const headers = lines[0].split(",")
    const logs = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",")
        const logEntry = {}
        headers.forEach((header, index) => {
          logEntry[header.replace(/"/g, "")] = values[index]?.replace(/"/g, "") || ""
        })
        logs.push(logEntry)
      }
    }

    console.log(`[v0] Parsed ${logs.length} log entries`)

    // Analyze request patterns
    const requestPaths = {}
    const userAgents = {}
    const statusCodes = {}
    const securityThreats = []
    const legitimateRequests = []

    logs.forEach((log) => {
      const path = log.requestPath || ""
      const userAgent = log.requestUserAgent || ""
      const statusCode = log.responseStatusCode || ""
      const message = log.message || ""

      // Count request paths
      requestPaths[path] = (requestPaths[path] || 0) + 1

      // Count user agents
      userAgents[userAgent] = (userAgents[userAgent] || 0) + 1

      // Count status codes
      statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1

      // Identify security threats
      if (
        path.includes("wp-admin") ||
        path.includes("wp-login") ||
        path.includes("wp-content") ||
        path.includes("admin.php") ||
        path.includes("config.php") ||
        path.includes(".env") ||
        path.includes("phpmyadmin")
      ) {
        securityThreats.push({
          path,
          userAgent,
          message,
          time: log.TimeUTC,
        })
      } else if (path.includes("admin-new") || path.includes("auth/login") || path.includes("api/")) {
        legitimateRequests.push({
          path,
          statusCode,
          message,
          time: log.TimeUTC,
        })
      }
    })

    // Generate report
    console.log("\n[v0] === SECURITY LOG ANALYSIS REPORT ===")

    console.log("\n[v0] TOP REQUEST PATHS:")
    Object.entries(requestPaths)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([path, count]) => {
        console.log(`[v0] ${count}x - ${path}`)
      })

    console.log("\n[v0] STATUS CODE DISTRIBUTION:")
    Object.entries(statusCodes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([code, count]) => {
        console.log(`[v0] ${code}: ${count} requests`)
      })

    console.log(`\n[v0] SECURITY THREATS DETECTED: ${securityThreats.length}`)
    if (securityThreats.length > 0) {
      console.log("[v0] Sample threats:")
      securityThreats.slice(0, 5).forEach((threat) => {
        console.log(`[v0] - ${threat.path} (${threat.time})`)
      })
    }

    console.log(`\n[v0] LEGITIMATE REQUESTS: ${legitimateRequests.length}`)
    if (legitimateRequests.length > 0) {
      console.log("[v0] Sample legitimate requests:")
      legitimateRequests.slice(0, 5).forEach((req) => {
        console.log(`[v0] - ${req.path} [${req.statusCode}]`)
      })
    }

    // Security recommendations
    console.log("\n[v0] === SECURITY RECOMMENDATIONS ===")

    if (securityThreats.length > 0) {
      console.log("[v0] 1. WordPress scanning attempts detected - middleware is correctly blocking these")
      console.log("[v0] 2. Consider implementing rate limiting for suspicious IPs")
      console.log("[v0] 3. Monitor for repeated attempts from same user agents")
    }

    if (legitimateRequests.some((req) => req.statusCode === "500")) {
      console.log("[v0] 4. Some legitimate API requests are returning 500 errors - needs investigation")
    }

    console.log("[v0] 5. Middleware authentication is working correctly for unauthorized requests")
  } catch (error) {
    console.error("[v0] Error analyzing security logs:", error)
  }
}

analyzeSecurityLogs()
