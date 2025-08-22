"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function ContentManagementPage() {
  const router = useRouter()
  const [content, setContent] = useState({
    heroTitle: "Transform Your Floors with Premium Epoxy",
    heroSubtitle: "Professional epoxy flooring solutions for residential and commercial spaces",
    aboutText: "We are the leading epoxy flooring specialists in the region",
    servicesTitle: "Our Services",
    contactInfo: "Get your free quote today!",
  })

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })
      if (response.ok) {
        alert("Content updated successfully!")
      }
    } catch (error) {
      console.error("Failed to update content:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Content Management</h1>
          <Button onClick={() => router.push("/admin")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Homepage Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.heroTitle}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Textarea
                  value={content.heroSubtitle}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>About Text</Label>
                <Textarea
                  value={content.aboutText}
                  onChange={(e) => setContent({ ...content, aboutText: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
