"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowRight, Shield, Clock, Award, Phone, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    details: "",
  })

  const handleCallNow = () => {
    window.location.href = "tel:+15551234567"
  }

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert("Quote request submitted successfully! We'll contact you within 24 hours.")
        setFormData({ name: "", phone: "", email: "", details: "" })
      } else {
        alert("There was an error submitting your quote request. Please try again.")
      }
    } catch (error) {
      alert("There was an error submitting your quote request. Please try again.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-800 rounded"></div>
              <span className="text-xl font-bold text-gray-900">Crafted Surface Solutions</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-800">
                Home
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-green-800">
                Services
              </Link>
              <Link href="/gallery" className="text-gray-700 hover:text-green-800">
                Gallery
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-green-800">
                Contact
              </Link>
            </nav>
            <Button onClick={handleCallNow} className="bg-green-800 hover:bg-green-900">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-800 text-green-100 hover:bg-green-800">
                Professional Epoxy Solutions
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your Floors with
                <span className="text-green-800"> Premium Epoxy</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                From residential garages to commercial warehouses, we deliver durable, beautiful epoxy flooring
                solutions that last for decades.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-green-800 hover:bg-green-900 text-white"
                  onClick={() => document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Get Free Quote
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-green-800 text-green-800 hover:bg-green-800 hover:text-white bg-transparent"
                  onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                >
                  View Our Work
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/modern-garage-epoxy.png"
                  alt="Premium epoxy flooring installation"
                  width={600}
                  height={600}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quote-form" className="py-16 bg-green-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Get Your Free Quote Today</h2>
            <p className="text-xl text-green-100">
              Tell us about your project and we'll provide a detailed estimate within 24 hours
            </p>
          </div>
          <Card className="bg-white">
            <CardContent className="p-8">
              <form onSubmit={handleQuoteSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Details</label>
                  <textarea
                    rows={4}
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-800"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-green-800 hover:bg-green-900">
                  Request Free Quote
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Epoxy Solutions?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine premium materials, expert craftsmanship, and proven techniques to deliver floors that exceed
              expectations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-800" />
                </div>
                <CardTitle>Lifetime Durability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our epoxy systems are engineered to withstand heavy traffic, chemicals, and daily wear for decades.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle>Fast Installation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Most residential projects completed in 2-3 days with minimal disruption to your daily routine.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-teal-600" />
                </div>
                <CardTitle>Expert Craftsmanship</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Certified installers with 15+ years experience and thousands of successful installations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Complete epoxy flooring solutions for every application</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Residential Garages", query: "residential garage epoxy flooring" },
              { name: "Commercial Warehouses", query: "commercial warehouse epoxy floor" },
              { name: "Retail Spaces", query: "retail store epoxy flooring" },
              { name: "Industrial Facilities", query: "industrial epoxy floor coating" },
            ].map((service, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video">
                  <Image
                    src={`/abstract-geometric-shapes.png?height=200&width=300&query=${service.query}`}
                    alt={service.name}
                    width={300}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <div className="flex justify-center items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-900">4.9/5 Rating</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Mike Johnson",
                role: "Homeowner",
                content:
                  "Absolutely incredible work! My garage floor looks like a showroom now. The team was professional, clean, and finished ahead of schedule.",
              },
              {
                name: "Sarah Chen",
                role: "Business Owner",
                content:
                  "We needed our warehouse floor done quickly without shutting down operations. CSS delivered perfectly - minimal disruption and amazing results.",
              },
              {
                name: "David Rodriguez",
                role: "Property Manager",
                content:
                  "I've worked with many contractors over the years. CSS stands out for their attention to detail and customer service. Highly recommended!",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-green-800 rounded"></div>
                <span className="text-xl font-bold">Crafted Surface Solutions</span>
              </div>
              <p className="text-gray-400">
                Professional epoxy flooring solutions for residential and commercial applications.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Residential Epoxy</li>
                <li>Commercial Flooring</li>
                <li>Industrial Coatings</li>
                <li>Decorative Finishes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Gallery</li>
                <li>Testimonials</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>info@craftedsurface.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Crafted Surface Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
