"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LegacyAdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin-new")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting to admin portal...</div>
    </div>
  )
}
