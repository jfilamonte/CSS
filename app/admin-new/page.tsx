"use client"

import { AdminDashboardNew } from "@/components/admin-dashboard-new"

export default function AdminPage() {
  // The middleware already handles authentication, so this page can render directly
  return <AdminDashboardNew />
}
