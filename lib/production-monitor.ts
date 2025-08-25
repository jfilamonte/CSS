import { logError, logPerformance } from "@/lib/error-logger"
import { createClient } from "@/lib/supabase/client"

interface SystemHealth {
  database_status: "healthy" | "degraded" | "down"
  api_response_time: number
  error_rate: number
  active_users: number
  last_check: Date
}

class ProductionMonitor {
  private static instance: ProductionMonitor
  private supabase = createClient()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isClient = typeof window !== "undefined"

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor()
    }
    return ProductionMonitor.instance
  }

  constructor() {
    if (this.isClient && process.env.NODE_ENV === "production") {
      this.startHealthChecks()
      this.monitorPagePerformance()
    }
  }

  private startHealthChecks() {
    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(
      () => {
        this.performHealthCheck()
      },
      5 * 60 * 1000,
    )

    // Initial health check
    this.performHealthCheck()
  }

  private async performHealthCheck(): Promise<SystemHealth> {
    const startTime = performance.now()
    let databaseStatus: SystemHealth["database_status"] = "healthy"
    let errorRate = 0

    try {
      // Test database connectivity
      const { error: dbError } = await this.supabase.from("users").select("count").limit(1)

      if (dbError) {
        databaseStatus = "degraded"
        await logError(dbError, {
          severity: "warn",
          context: { action: "health_check_database" },
        })
      }

      // Calculate API response time
      const endTime = performance.now()
      const responseTime = endTime - startTime

      // Get recent error rate (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const { data: recentErrors } = await this.supabase
        .from("error_logs")
        .select("id")
        .gte("timestamp", oneHourAgo.toISOString())

      errorRate = recentErrors?.length || 0

      const health: SystemHealth = {
        database_status: databaseStatus,
        api_response_time: responseTime,
        error_rate: errorRate,
        active_users: 0, // Would need session tracking
        last_check: new Date(),
      }

      // Log performance metrics
      await logPerformance({
        metric_type: "database_query",
        metric_name: "health_check",
        value: responseTime,
        unit: "ms",
        url: window.location.href,
        timestamp: new Date(),
        context: { health_status: databaseStatus },
      })

      // Alert on high error rates
      if (errorRate > 10) {
        await logError(`High error rate detected: ${errorRate} errors in the last hour`, {
          severity: "warn",
          context: { action: "health_check_alert", error_rate: errorRate },
        })
      }

      console.log("[v0] Health check completed:", health)
      return health
    } catch (error) {
      await logError(error as Error, {
        severity: "error",
        context: { action: "health_check_failed" },
      })

      return {
        database_status: "down",
        api_response_time: -1,
        error_rate: -1,
        active_users: 0,
        last_check: new Date(),
      }
    }
  }

  private monitorPagePerformance() {
    // Monitor page load performance
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming

      if (navigation) {
        // Log key performance metrics
        logPerformance({
          metric_type: "page_load",
          metric_name: "dom_content_loaded",
          value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          unit: "ms",
          url: window.location.href,
          timestamp: new Date(),
        })

        logPerformance({
          metric_type: "page_load",
          metric_name: "full_page_load",
          value: navigation.loadEventEnd - navigation.loadEventStart,
          unit: "ms",
          url: window.location.href,
          timestamp: new Date(),
        })

        // Alert on slow page loads (>3 seconds)
        const totalLoadTime = navigation.loadEventEnd - navigation.navigationStart
        if (totalLoadTime > 3000) {
          logError(`Slow page load detected: ${totalLoadTime}ms`, {
            severity: "warn",
            context: { action: "slow_page_load", load_time: totalLoadTime },
          })
        }
      }
    })

    // Monitor Core Web Vitals if available
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "largest-contentful-paint") {
              logPerformance({
                metric_type: "page_load",
                metric_name: "largest_contentful_paint",
                value: entry.startTime,
                unit: "ms",
                url: window.location.href,
                timestamp: new Date(),
              })
            }
          }
        })

        observer.observe({ entryTypes: ["largest-contentful-paint"] })
      } catch (error) {
        console.warn("[v0] Performance observer not supported:", error)
      }
    }
  }

  async getSystemHealth(): Promise<SystemHealth | null> {
    return this.performHealthCheck()
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}

// Global instance
export const productionMonitor = ProductionMonitor.getInstance()

// React hook for production monitoring
export function useProductionMonitor() {
  return {
    getSystemHealth: productionMonitor.getSystemHealth.bind(productionMonitor),
  }
}
