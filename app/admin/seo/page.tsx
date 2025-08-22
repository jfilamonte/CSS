"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function SEOManagementPage() {
  const router = useRouter()
  const [seoData, setSeoData] = useState({
    title: "Professional Epoxy Flooring Services",
    description: "Transform your floors with premium epoxy coatings. Professional installation, durable results.",
    keywords: "epoxy flooring, garage floors, commercial flooring, concrete coating",
    ogTitle: "Premium Epoxy Flooring Solutions",
    ogDescription: "Professional epoxy flooring services for residential and commercial properties",
  })

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoData),
      })
      if (response.ok) {
        alert("SEO settings updated successfully!")
      }
    } catch (error) {
      console.error("Failed to update SEO:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">SEO Management</h1>
          <Button onClick={() => router.push("/admin")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Page Title</Label>
              <Input value={seoData.title} onChange={(e) => setSeoData({ ...seoData, title: e.target.value })} />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={seoData.description}
                onChange={(e) => setSeoData({ ...seoData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Keywords</Label>
              <Input value={seoData.keywords} onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              Save SEO Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
