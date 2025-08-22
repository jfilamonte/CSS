"use client"

import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  defaultValue="Crafted Surface Solutions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="text" className="w-full border rounded px-3 py-2" defaultValue="(555) 123-4567" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                <input type="email" className="w-full border rounded px-3 py-2" defaultValue="info@craftedfloors.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reply To</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  defaultValue="support@craftedfloors.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">System Maintenance</h2>
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Clear Cache</button>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Export Data</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">System Backup</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
