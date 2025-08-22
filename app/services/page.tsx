import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Star, Shield, Clock, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Professional Epoxy Flooring Services | Crafted Surface Solutions",
  description:
    "Expert epoxy flooring services for residential, commercial, and industrial applications. Durable, beautiful floors with lifetime warranties.",
  keywords: "epoxy flooring, concrete resurfacing, garage floors, commercial flooring, industrial coatings",
  openGraph: {
    title: "Professional Epoxy Flooring Services | Crafted Surface Solutions",
    description: "Expert epoxy flooring services for residential, commercial, and industrial applications.",
    images: ["/modern-garage-epoxy.png"],
  },
}

export default function ServicesPage() {
  const services = [
    {
      title: "Residential Epoxy Flooring",
      description: "Transform your garage, basement, or living space with durable epoxy floors",
      features: ["Slip-resistant finish", "Easy to clean", "Chemical resistant", "20+ year warranty"],
      image: "luxury residential garage with metallic epoxy flooring system",
      price: "Starting at $4.50/sq ft",
      benefits: ["Increases home value", "Low maintenance", "Customizable colors", "Fast installation"],
    },
    {
      title: "Commercial Epoxy Systems",
      description: "Heavy-duty flooring solutions for warehouses, factories, and retail spaces",
      features: ["High traffic durability", "Custom colors", "Fast installation", "Minimal downtime"],
      image: "modern commercial warehouse with high-performance epoxy coating",
      price: "Starting at $6.00/sq ft",
      benefits: ["Reduces maintenance costs", "Improves safety", "Professional appearance", "Long-term durability"],
    },
    {
      title: "Concrete Resurfacing",
      description: "Repair and restore damaged concrete surfaces to like-new condition",
      features: ["Crack repair", "Surface leveling", "Texture options", "Color matching"],
      image: "concrete resurfacing project showing before and after transformation",
      price: "Starting at $3.50/sq ft",
      benefits: ["Cost-effective solution", "Extends surface life", "Improves appearance", "Prevents further damage"],
    },
    {
      title: "Decorative Concrete",
      description: "Stamped, stained, and polished concrete for aesthetic appeal",
      features: ["Custom patterns", "Color options", "Sealed finish", "Low maintenance"],
      image: "decorative stamped concrete with custom patterns and staining",
      price: "Starting at $5.00/sq ft",
      benefits: ["Unique designs", "Weather resistant", "Eco-friendly", "Versatile applications"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Professional epoxy flooring and concrete solutions for every need
            </p>
            <nav className="mt-6 text-sm">
              <Link href="/" className="text-green-200 hover:text-white">
                Home
              </Link>
              <span className="mx-2 text-green-300">/</span>
              <span className="text-white">Services</span>
            </nav>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="h-full hover:shadow-xl transition-shadow">
                  <div className="aspect-video">
                    <Image
                      src={`/abstract-geometric-shapes.png?height=250&width=400&query=${service.image}`}
                      alt={service.title}
                      width={400}
                      height={250}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 text-gray-900">Key Features:</h4>
                      <ul className="space-y-1 mb-4">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 text-gray-900">Benefits:</h4>
                      <ul className="space-y-1 mb-4">
                        {service.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex space-x-2">
                      <Button asChild className="flex-1">
                        <Link href="/#quote-form">
                          Get Quote <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/gallery">View Work</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Services?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We deliver exceptional results with proven expertise and premium materials
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Warranty</h3>
                <p className="text-gray-600">
                  All our work comes with comprehensive warranties for your peace of mind.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Turnaround</h3>
                <p className="text-gray-600">Most projects completed within 2-3 days with minimal disruption.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                <p className="text-gray-600">Certified professionals with 15+ years of experience.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
