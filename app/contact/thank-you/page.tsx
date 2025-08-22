import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Phone, Mail } from "lucide-react"
import Link from "next/link"

export default function ContactThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
              <p className="text-lg text-gray-600 mb-6">
                Your message has been sent successfully. We'll get back to you within 24 hours.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-green-900 mb-4">What happens next?</h2>
                <ul className="text-left text-green-800 space-y-2">
                  <li>• We'll review your message and project details</li>
                  <li>• A team member will contact you within 24 hours</li>
                  <li>• We'll schedule a free consultation if needed</li>
                  <li>• You'll receive a detailed quote within 48 hours</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/">Return Home</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#quote-form">Get Another Quote</Link>
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">Need immediate assistance?</p>
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">(413) 497-2100</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">sales@craftedsurfacesolutions.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
