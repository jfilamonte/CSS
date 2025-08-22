"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsEvent {
  event_type: string
  event_data: Record<string, any>
  user_id?: string
  session_id: string
  user_agent: string
  ip_address?: string
}

export default function AnalyticsTracking() {
  const supabase = createClient()

  useEffect(() => {
    // Generate session ID
    const sessionId = generateSessionId()

    // Track page view
    trackEvent("page_view", {
      page: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    })

    // Track user interactions
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === "BUTTON" || target.tagName === "A") {
        trackEvent("click", {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.slice(0, 100),
          href: target.getAttribute("href"),
          className: target.className,
        })
      }
    }

    const handleFormSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement
      trackEvent("form_submit", {
        form_id: form.id,
        form_action: form.action,
        form_method: form.method,
      })
    }

    // Add event listeners
    document.addEventListener("click", handleClick)
    document.addEventListener("submit", handleFormSubmit)

    // Track time on page
    const startTime = Date.now()
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime
      trackEvent("page_exit", {
        time_on_page: timeOnPage,
        page: window.location.pathname,
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup
    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("submit", handleFormSubmit)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const trackEvent = async (eventType: string, eventData: Record<string, any>) => {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event_type: eventType,
        event_data: eventData,
        session_id: generateSessionId(),
        user_agent: navigator.userAgent,
      }

      await supabase.from("analytics_events").insert([analyticsEvent])
    } catch (error) {
      console.error("Error tracking analytics event:", error)
    }
  }

  // This component doesn't render anything
  return null
}

// Export tracking functions for manual use
export const trackCustomEvent = async (eventType: string, eventData: Record<string, any>) => {
  const supabase = createClient()

  try {
    const analyticsEvent: AnalyticsEvent = {
      event_type: eventType,
      event_data: eventData,
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_agent: navigator.userAgent,
    }

    await supabase.from("analytics_events").insert([analyticsEvent])
  } catch (error) {
    console.error("Error tracking custom event:", error)
  }
}

export const trackQuoteRequest = (quoteData: Record<string, any>) => {
  trackCustomEvent("quote_request", quoteData)
}

export const trackAppointmentScheduled = (appointmentData: Record<string, any>) => {
  trackCustomEvent("appointment_scheduled", appointmentData)
}

export const trackProjectCompleted = (projectData: Record<string, any>) => {
  trackCustomEvent("project_completed", projectData)
}
