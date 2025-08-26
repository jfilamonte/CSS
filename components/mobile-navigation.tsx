"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, Briefcase, ImageIcon, Phone, User, LogIn, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut, isAdmin } = useAuth()

  const closeMenu = () => setIsOpen(false)

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/services", label: "Services", icon: Briefcase },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/contact", label: "Contact", icon: Phone },
  ]

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-800 rounded"></div>
                <span className="font-bold text-gray-900">CSS</span>
              </div>
              <Button variant="ghost" size="sm" onClick={closeMenu}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t pt-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{user.user_metadata?.full_name || user.email?.split("@")[0]}</span>
                  </div>
                  {isAdmin && (
                    <Link href="/admin-new" onClick={closeMenu}>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <User className="w-4 h-4 mr-2" />
                        Admin Portal
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      signOut()
                      closeMenu()
                    }}
                    className="w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/auth/login" onClick={closeMenu}>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => {
                  window.location.href = "tel:+15551234567"
                  closeMenu()
                }}
                className="w-full bg-green-800 hover:bg-green-900"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
