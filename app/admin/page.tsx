import { redirect } from "next/navigation"

export default function LegacyAdminPage() {
  redirect("/admin-new")
}
