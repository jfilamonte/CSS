"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CMSPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified admin portal CMS section
    router.replace("/admin-new?tab=cms")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting to CMS...</div>
    </div>
  )
}
