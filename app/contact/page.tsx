"use client"

import type React from "react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formDataObj,
      })

      if (response.ok) {
        // Form will redirect to thank you page
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Contact form error:", error)
      alert("Failed to send message. Please try again or call us directly.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Ready to transform your space? Get in touch for a free consultation
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                      <Input
                        placeholder="Last Name"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <Input
                      placeholder="Email Address"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                      placeholder="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quote-request">Quote Request</SelectItem>
                        <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                        <SelectItem value="existing-project">Existing Project</SelectItem>
                        <SelectItem value="warranty-claim">Warranty Claim</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Phone className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Phone</h3>
                    </div>
                    <p className="text-gray-600">(413) 497-2100</p>
                    <p className="text-sm text-gray-500">Call for immediate assistance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Mail className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Email</h3>
                    </div>
                    <p className="text-gray-600">sales@craftedsurfacesolutions.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Service Area</h3>
                    </div>
                    <p className="text-gray-600">
                      Northeast United States
                      <br />
                      Massachusetts, Connecticut, Rhode Island
                    </p>
                    <p className="text-sm text-gray-500">Servicing the Northeast and beyond!</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Clock className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Business Hours</h3>
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <p>Monday - Friday: 7:00 AM - 6:00 PM</p>
                      <p>Saturday: Emergency Calls only </p>
                      <p>Sunday: Emergency calls only</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">24/7 emergency service available</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
