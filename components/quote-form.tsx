"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function QuoteForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    squareFootage: "",
    timeline: "",
    address: "",
    details: "",
    requestBooking: false,
    preferredDate: "",
    preferredTime: "",
    bookingType: "",
    bookingNotes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const basePrices = {
        "residential-garage": 6.0,
        "commercial-warehouse": 5.0,
        "retail-space": 6.5,
        "industrial-facility": 7.0,
        other: 6.0,
      }

      const sqft = Number.parseInt(formData.squareFootage) || 0
      const baseRate = basePrices[formData.projectType as keyof typeof basePrices] || 6.0
      const estimatedCost = sqft * baseRate

      // Simulate successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsSubmitted(true)
    } catch (err) {
      console.error("Error submitting quote:", err)
      setError("Failed to submit quote. Please try again or call us directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="shadow-2xl">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your interest! We'll review your project details and get back to you within 24 hours with a
              detailed estimate.
            </p>
            <p className="text-sm text-gray-500">
              Need immediate assistance? Call us at{" "}
              <a href="tel:+14134972100" className="text-blue-600 font-medium">
                (413) 497-2100
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Request Quote</CardTitle>
        <CardDescription className="text-center">
          Fill out the form below and we'll get back to you quickly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-type">Project Type *</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleInputChange("projectType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential-garage">Residential Garage</SelectItem>
                  <SelectItem value="commercial-warehouse">Commercial Warehouse</SelectItem>
                  <SelectItem value="retail-space">Retail Space</SelectItem>
                  <SelectItem value="industrial-facility">Industrial Facility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="square-footage">Square Footage</Label>
              <Input
                id="square-footage"
                type="number"
                placeholder="1000"
                value={formData.squareFootage}
                onChange={(e) => handleInputChange("squareFootage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Desired Timeline</Label>
              <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP</SelectItem>
                  <SelectItem value="1-month">Within 1 Month</SelectItem>
                  <SelectItem value="2-3-months">2-3 Months</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Project Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State 12345"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Project Details</Label>
            <Textarea
              id="details"
              placeholder="Tell us about your project, current floor condition, specific requirements, etc."
              rows={4}
              value={formData.details}
              onChange={(e) => handleInputChange("details", e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full hover:bg-green-700 bg-green-800" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Quote Request"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
