"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Quote {
  id: string
  customer_name: string
  email: string
  phone: string
  project_type: string
  square_footage: number
  estimated_cost: number
  status: string
  notes?: string
  created_at: string
}

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: "",
    email: "",
    phone: "",
    project_type: "",
    square_footage: 0,
    estimated_cost: 0,
    status: "pending",
    notes: "",
  })

  useEffect(() => {
    if (quoteId) {
      loadQuote()
    }
  }, [quoteId])

  const loadQuote = async () => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)
        setFormData({
          customer_name: data.customer_name || "",
          email: data.email || "",
          phone: data.phone || "",
          project_type: data.project_type || "",
          square_footage: data.square_footage || 0,
          estimated_cost: data.estimated_cost || 0,
          status: data.status || "pending",
          notes: data.notes || "",
        })
      } else {
        console.error("Failed to load quote")
        router.push("/admin/quotes")
      }
    } catch (error) {
      console.error("Error loading quote:", error)
      router.push("/admin/quotes")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...quote, ...formData }),
      })

      if (response.ok) {
        router.push("/admin/quotes")
      } else {
        console.error("Failed to save quote")
      }
    } catch (error) {
      console.error("Error saving quote:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quote Not Found</h2>
          <Button onClick={() => router.push("/admin/quotes")}>Back to Quotes</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Edit Quote</h1>
          <Button variant="outline" onClick={() => router.push("/admin/quotes")}>
            Back to Quotes
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateFormData("customer_name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="project_type">Project Type</Label>
                <Input
                  id="project_type"
                  value={formData.project_type}
                  onChange={(e) => updateFormData("project_type", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="square_footage">Square Footage</Label>
                <Input
                  id="square_footage"
                  type="number"
                  value={formData.square_footage}
                  onChange={(e) => updateFormData("square_footage", Number.parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => updateFormData("estimated_cost", Number.parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                rows={4}
                placeholder="Additional notes about this quote..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/quotes")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? "Saving..." : "Save Quote"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
