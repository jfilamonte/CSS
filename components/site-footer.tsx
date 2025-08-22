import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-black">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/css-logo.png"
                alt="Crafted Surface Solutions"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <div>
                <h3 className="text-xl font-bold">Crafted Surface Solutions</h3>
                <p className="text-gray-400">Concrete Resurfacing & Epoxy Floors</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Professional epoxy flooring and concrete resurfacing services for residential and commercial properties.
              Transform your space with durable, beautiful surfaces that last.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-400 hover:text-white">
                Home
              </Link>
              <Link href="/services" className="text-gray-400 hover:text-white">
                Services
              </Link>
              <Link href="/gallery" className="text-gray-400 hover:text-white">
                Gallery
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white">
                About Us
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">(413) 497-2100 </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400 mx-0 py-0 my-0 px-[1- 0px] px-[-2px] px-[-0px] text-left">sales@craftedsurfacesolutions.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">{"Servicing the Northeast and beyond!"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2024 Crafted Surface Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
