import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Award, Users, Clock, Shield, Phone, Mail, MapPin } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  const stats = [
    { icon: Award, label: "Years Experience", value: "15+" },
    { icon: Users, label: "Happy Customers", value: "500+" },
    { icon: Clock, label: "Projects Completed", value: "1000+" },
    { icon: Shield, label: "Warranty Years", value: "20" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg- text-white py-16 bg-green-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Your trusted partner in concrete resurfacing and epoxy flooring solutions
            </p>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <p className="text-gray-600 mb-4">
                  CSS specializes in epoxy flooring, concrete polishing, decorative flake and quartz systems, urethane cement, floor leveling, surface preparation, coatings, moisture mitigation, and removal. We serve residential, commercial, industrial, and government clients across Massachusetts, Connecticut, and the Northeast—delivering durable, high-performance floors for any environment.
                </p>
                
                
              </div>
              <div className="relative h-96">
                <Image
                  src="/concrete-epoxy-flooring-team.png"
                  alt="Our team at work"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        

        {/* Contact/Request Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
              <p className="text-lg text-gray-600">
                Ready to transform your space? Contact us today for a consultation or to learn more about our services.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">(413) 497-2100</p>
                      <p className="text-sm text-gray-600">Mon-Fri 7AM-6PM </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">sales@craftedsurfacesolutions.com</p>
                      <p className="text-sm text-gray-600">We respond within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Serving the Greater Metro Area</p>
                      <p className="text-sm text-gray-600">Free estimate </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>Fill out the form below and we'll get back to you within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Name *</Label>
                        <Input id="contact-name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email *</Label>
                        <Input id="contact-email" type="email" placeholder="your@email.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input id="contact-phone" type="tel" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">Subject</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="What can we help you with?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quote">Request Quote</SelectItem>
                          <SelectItem value="consultation">Schedule Consultation</SelectItem>
                          <SelectItem value="question">General Question</SelectItem>
                          <SelectItem value="support">Customer Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message">Message *</Label>
                      <Textarea
                        id="contact-message"
                        placeholder="Tell us about your project or how we can help..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
