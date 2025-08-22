"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ clientSecret, invoiceId }: { clientSecret: string; invoiceId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?invoice_id=${invoiceId}`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An error occurred")
      } else {
        setMessage("An unexpected error occurred.")
      }
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={isLoading || !stripe || !elements} className="w-full">
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
      {message && <div className="text-sm text-red-600 mt-2">{message}</div>}
    </form>
  )
}

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get("client_secret")
  const invoiceId = searchParams.get("invoice_id")

  if (!clientSecret || !invoiceId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>Invalid payment parameters</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>Secure payment processing powered by Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements options={options} stripe={stripePromise}>
            <PaymentForm clientSecret={clientSecret} invoiceId={invoiceId} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  )
}
