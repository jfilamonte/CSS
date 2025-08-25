import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Crafted Surface Solutions - Premium Epoxy Flooring",
  description:
    "Professional epoxy flooring solutions for residential and commercial applications. Transform your floors with durable, beautiful epoxy coatings.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
