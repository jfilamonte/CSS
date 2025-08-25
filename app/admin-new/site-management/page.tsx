import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import AdminSiteManager from "@/components/admin-site-manager"

export default async function SiteManagementPage() {
  try {
    await requireAdmin()
  } catch (error) {
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
