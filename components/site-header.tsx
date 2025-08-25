"use client"

import Link from "next/link"
import Image from "next/image"
import { Phone, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="text-white py-2 bg-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span className="font-medium">(413) 497-2100</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="hidden sm:flex items-center space-x-2">
              <span>📧</span>
              <span className="font-medium">sales@craftedsurfacesolutions.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Company Name */}
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/css-logo.png" alt="Crafted Surface Solutions" width={40} height={40} className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Crafted Surface Solutions</h1>
              <p className="text-sm text-gray-600">Concrete Resurfacing & Epoxy Floors</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
              Home
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-green-600 font-medium">
              Services
            </Link>
            <Link href="/gallery" className="text-gray-700 hover:text-green-600 font-medium">
              Gallery
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 font-medium">
              Contact
            </Link>
          </nav>

          {/* Contact Info and CTA */}
          <div className="flex items-center space-x-4">
            <Button asChild className="hidden sm:inline-flex hover:bg-green-700 bg-green-800">
              <Link href="#quote-form">Get Quote</Link>
            </Button>
            {/* <Button asChild variant="outline" size="sm">
              <Link href="/auth/customer-login">Customer Portal</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-new">Admin</Link>
            </Button> */}

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
                Home
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-green-600 font-medium">
                Services
              </Link>
              <Link href="/gallery" className="text-gray-700 hover:text-green-600 font-medium">
                Gallery
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-green-600 font-medium">
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
