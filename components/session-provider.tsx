"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { sessionManager, type SessionState } from "@/lib/session-manager"
import { useToast } from "@/hooks/use-toast"

interface SessionContextType {
  session: SessionState
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
  initialSession?: SessionState
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [session, setSession] = useState<SessionState>(
    initialSession || {
      user: null,
      role: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      sessionId: null,
      error: null,
    },
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionState = await sessionManager.validateClientSession()
        setSession(sessionState)

        if (sessionState.error && sessionState.error !== "No session found") {
          toast({
            title: "Session Warning",
            description: "Your session may be unstable. Some features might be limited.",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Session initialization error:", error)
        toast({
          title: "Connection Issue",
          description: "Unable to verify your session. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [toast])

  useEffect(() => {
    if (!session.isAuthenticated) return

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    const updateActivity = () => {
      sessionManager.updateActivity()
      setSession((prev) => ({ ...prev, lastActivity: Date.now() }))
    }

    // Add activity listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, true)
    })

    // Session expiry check
    const checkExpiry = setInterval(() => {
      if (sessionManager.isSessionExpired()) {
        toast({
          title: "Session Expired",
          description: "Your session has expired due to inactivity. Please log in again.",
          variant: "default",
        })
        logout()
      }
    }, 60000) // Check every minute

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity, true)
      })
      clearInterval(checkExpiry)
    }
  }, [session.isAuthenticated, toast])

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const newSession = await sessionManager.validateClientSession()
      setSession(newSession)

      if (newSession.error) {
        toast({
          title: "Session Issue",
          description: "There was an issue refreshing your session.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Session refresh error:", error)
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh your session. Please log in again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await sessionManager.cleanupSession()
      setSession({
        user: null,
        role: null,
        isAuthenticated: false,
        lastActivity: Date.now(),
        sessionId: null,
        error: null,
      })
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout even if cleanup fails
      setSession({
        user: null,
        role: null,
        isAuthenticated: false,
        lastActivity: Date.now(),
        sessionId: null,
        error: null,
      })
      router.push("/auth/login")
    }
  }

  return (
    <SessionContext.Provider value={{ session, refreshSession, logout, isLoading }}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
