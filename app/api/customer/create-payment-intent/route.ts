import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"
import Stripe from "stripe"

let stripe: Stripe | null = null

function getStripeClient(): Stripe {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  }

  if (!stripe) {
    throw new Error("Stripe not available")
  }

  return stripe
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId } = await request.json()

    const invoice = await db.invoices.findFirst({
      id: invoiceId,
      customerId: user.id,
      status: "PENDING",
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const stripeClient = getStripeClient()
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(invoice.amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        invoiceId: invoice.id,
        customerId: user.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
