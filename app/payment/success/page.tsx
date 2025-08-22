"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("invoice_id")
  const [paymentStatus, setPaymentStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?invoice_id=${invoiceId}`)
        if (response.ok) {
          setPaymentStatus("success")
        } else {
          setPaymentStatus("error")
        }
      } catch (error) {
        setPaymentStatus("error")
      }
    }

    if (invoiceId) {
      verifyPayment()
    }
  }, [invoiceId])

  if (paymentStatus === "loading") {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Verifying Payment...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (paymentStatus === "error") {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>There was an issue verifying your payment. Please contact support.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">You will receive a confirmation email shortly.</p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/customer/dashboard">View Dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
