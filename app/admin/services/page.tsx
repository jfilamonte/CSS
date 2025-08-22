"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"

interface ServicePackage {
  id: string
  name: string
  description: string
  package_type: string
  base_price_per_sqft: number
  is_active: boolean
  created_at: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServicePackage | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    package_type: "",
    base_price_per_sqft: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/admin/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error("Failed to fetch services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services"
      const method = editingService ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchServices()
        setIsCreateModalOpen(false)
        setEditingService(null)
        setFormData({ name: "", description: "", package_type: "", base_price_per_sqft: 0, is_active: true })
      }
    } catch (error) {
      console.error("Failed to save service:", error)
    }
  }

  const handleEdit = (service: ServicePackage) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      package_type: service.package_type,
      base_price_per_sqft: service.base_price_per_sqft,
      is_active: service.is_active,
    })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" })
        if (response.ok) {
          await fetchServices()
        }
      } catch (error) {
        console.error("Failed to delete service:", error)
      }
    }
  }

  if (loading) {
    return <div className="p-6">Loading services...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Service Packages</h1>
        <div className="ml-auto">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Service Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service Package" : "Create Service Package"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="package_type">Package Type</Label>
                  <Input
                    id="package_type"
                    value={formData.package_type}
                    onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="base_price_per_sqft">Base Price per Sq Ft</Label>
                  <Input
                    id="base_price_per_sqft"
                    type="number"
                    step="0.01"
                    value={formData.base_price_per_sqft}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price_per_sqft: Number.parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.package_type}</CardDescription>
                </div>
                <Badge variant={service.is_active ? "default" : "secondary"}>
                  {service.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              <p className="text-lg font-semibold mb-4">${service.base_price_per_sqft}/sq ft</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(service.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
