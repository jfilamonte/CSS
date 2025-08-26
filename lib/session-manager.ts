import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { logError } from "@/lib/error-logger"

export interface SessionState {
  user: any | null
  role: string | null
  isAuthenticated: boolean
  lastActivity: number
  sessionId: string | null
  error: string | null
}

export interface SessionConfig {
  maxInactivityTime: number // milliseconds
  refreshThreshold: number // milliseconds before expiry to refresh
  maxRetries: number
  gracefulDegradation: boolean
}

const DEFAULT_CONFIG: SessionConfig = {
  maxInactivityTime: 30 * 60 * 1000, // 30 minutes
  refreshThreshold: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  gracefulDegradation: true,
}

export class EnterpriseSessionManager {
  private config: SessionConfig
  private retryCount = 0
  private lastRefreshAttempt = 0

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async validateServerSession(request?: Request): Promise<SessionState> {
    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        await logError(authError, "warning", {
          context: "server_session_validation",
          action: "auth_getUser",
        })

        if (this.config.gracefulDegradation) {
          return this.createGracefulSession(authError.message)
        }
        throw authError
      }

      if (!user) {
        return this.createEmptySession()
      }

      // Get user role with retry logic
      const role = await this.getUserRoleWithRetry(supabase, user)

      return {
        user,
        role,
        isAuthenticated: true,
        lastActivity: Date.now(),
        sessionId: user.id,
        error: null,
      }
    } catch (error) {
      await logError(error as Error, "error", {
        context: "server_session_validation",
        retryCount: this.retryCount,
      })

      if (this.config.gracefulDegradation) {
        return this.createGracefulSession((error as Error).message)
      }
      throw error
    }
  }

  async validateClientSession(): Promise<SessionState> {
    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        // Attempt session recovery
        const recovered = await this.attemptSessionRecovery(supabase)
        if (recovered) {
          return recovered
        }

        if (this.config.gracefulDegradation) {
          return this.createGracefulSession(authError.message)
        }
        throw authError
      }

      if (!user) {
        return this.createEmptySession()
      }

      const role = await this.getUserRoleWithRetry(supabase, user)

      return {
        user,
        role,
        isAuthenticated: true,
        lastActivity: Date.now(),
        sessionId: user.id,
        error: null,
      }
    } catch (error) {
      await logError(error as Error, "error", {
        context: "client_session_validation",
        retryCount: this.retryCount,
      })

      if (this.config.gracefulDegradation) {
        return this.createGracefulSession((error as Error).message)
      }
      throw error
    }
  }

  private async attemptSessionRecovery(supabase: any): Promise<SessionState | null> {
    if (this.retryCount >= this.config.maxRetries) {
      return null
    }

    const backoffTime = Math.pow(2, this.retryCount) * 1000 // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, backoffTime))

    try {
      this.retryCount++
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (!error && session) {
        this.retryCount = 0 // Reset on success
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const role = await this.getUserRoleWithRetry(supabase, user)
          return {
            user,
            role,
            isAuthenticated: true,
            lastActivity: Date.now(),
            sessionId: user.id,
            error: null,
          }
        }
      }
    } catch (recoveryError) {
      await logError(recoveryError as Error, "warning", {
        context: "session_recovery",
        attempt: this.retryCount,
      })
    }

    return null
  }

  private async getUserRoleWithRetry(supabase: any, user: any): Promise<string | null> {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const { data: userData, error } = await supabase.from("users").select("role").eq("email", user.email).single()

        if (error) {
          throw error
        }

        return userData?.role?.toLowerCase() || null
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          await logError(error as Error, "error", {
            context: "get_user_role",
            userEmail: user.email,
            attempts,
          })
          return null
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 500 * attempts))
      }
    }

    return null
  }

  private createGracefulSession(errorMessage: string): SessionState {
    return {
      user: null,
      role: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      sessionId: null,
      error: errorMessage,
    }
  }

  private createEmptySession(): SessionState {
    return {
      user: null,
      role: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      sessionId: null,
      error: null,
    }
  }

  updateActivity(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastActivity", Date.now().toString())
    }
  }

  isSessionExpired(): boolean {
    if (typeof window === "undefined") return false

    const lastActivity = localStorage.getItem("lastActivity")
    if (!lastActivity) return true

    const timeSinceActivity = Date.now() - Number.parseInt(lastActivity)
    return timeSinceActivity > this.config.maxInactivityTime
  }

  async cleanupSession(): Promise<void> {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()

      if (typeof window !== "undefined") {
        localStorage.removeItem("lastActivity")
        sessionStorage.clear()
      }
    } catch (error) {
      await logError(error as Error, "warning", {
        context: "session_cleanup",
      })
    }
  }
}

export const sessionManager = new EnterpriseSessionManager()
