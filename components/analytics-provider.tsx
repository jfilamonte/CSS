"use client"

import type React from "react"

import { useEffect } from "react"
import { analytics } from "@/lib/integrations/analytics"

interface AnalyticsProviderProps {
  children: React.ReactNode
  gaId?: string
  pixelId?: string
}

export default function AnalyticsProvider({ children, gaId, pixelId }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize Google Analytics
    if (gaId) {
      analytics.initializeGA(gaId)
    }

    // Initialize Facebook Pixel
    if (pixelId) {
      analytics.initializePixel(pixelId)
    }
  }, [gaId, pixelId])

  return <>{children}</>
}
