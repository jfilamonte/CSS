import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/database"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { invoiceId } = paymentIntent.metadata

        if (invoiceId) {
          // Update invoice status to PAID
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID",
              paidDate: new Date(),
              stripePaymentIntentId: paymentIntent.id,
            },
          })

          // Create payment record
          const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { project: true },
          })

          if (invoice?.projectId) {
            await prisma.payment.create({
              data: {
                projectId: invoice.projectId,
                amount: paymentIntent.amount / 100, // Convert from cents
                status: "PAID",
                method: "STRIPE",
                stripePaymentId: paymentIntent.id,
                paidAt: new Date(),
              },
            })
          }
        }
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent
        const { invoiceId: failedInvoiceId } = failedPayment.metadata

        if (failedInvoiceId) {
          // Update invoice status if needed
          await prisma.invoice.update({
            where: { id: failedInvoiceId },
            data: {
              status: "PENDING", // Keep as pending for retry
            },
          })
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
