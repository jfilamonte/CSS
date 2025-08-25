import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import AdminSiteManager from "@/components/admin-site-manager"

export default async function SiteManagementPage() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    redirect("/auth/login")
  }

  const user = await verifySession(sessionToken)
  if (!user || user.role !== "admin") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminSiteManager />
      </div>
    </div>
  )
}
