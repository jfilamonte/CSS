import { createClient } from "@/lib/supabase/server"

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    fbq: (...args: any[]) => void
  }
}

export async function trackEvent(eventName: string, properties: Record<string, any>) {
  try {
    // Google Analytics 4 tracking
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }

    // Facebook Pixel tracking
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", eventName, properties)
    }

    // Store in database for internal analytics
    const supabase = await createClient()
    await supabase.from("analytics_events").insert({
      event_type: eventName,
      event_data: properties,
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null,
      session_id: typeof window !== "undefined" ? sessionStorage.getItem("session_id") : null,
    })

    return { success: true }
  } catch (error) {
    console.error("Error tracking event:", error)
    return { success: false, error }
  }
}

export const trackQuoteRequest = (quoteData: any) =>
  trackEvent("quote_requested", {
    project_type: quoteData.projectType,
    square_footage: quoteData.squareFootage,
    estimated_value: quoteData.estimatedCost,
  })

export const trackQuoteConverted = (quoteData: any) =>
  trackEvent("quote_converted", {
    quote_id: quoteData.id,
    value: quoteData.totalCost,
    project_type: quoteData.projectType,
  })

export const trackAppointmentScheduled = (appointmentData: any) =>
  trackEvent("appointment_scheduled", {
    appointment_type: appointmentData.type,
    scheduled_date: appointmentData.scheduledDate,
  })

export function initializeGA(gaId: string) {
  if (typeof window === "undefined") return

  // Load Google Analytics script
  const script = document.createElement("script")
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  script.async = true
  document.head.appendChild(script)

  // Initialize gtag
  window.gtag = function gtag() {
    // @ts-ignore
    ;(window.dataLayer = window.dataLayer || []).push(arguments)
  }

  window.gtag("js", new Date())
  window.gtag("config", gaId, {
    page_title: document.title,
    page_location: window.location.href,
  })
}

export function initializePixel(pixelId: string) {
  if (typeof window === "undefined") return

  // Load Facebook Pixel script
  const script = document.createElement("script")
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `
  document.head.appendChild(script)
}

export const analytics = {
  trackEvent,
  trackQuoteRequest,
  trackQuoteConverted,
  trackAppointmentScheduled,
  initializeGA,
  initializePixel,
}
