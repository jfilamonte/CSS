"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, DollarSign } from "lucide-react"

interface Quote {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  project_address: string
  square_footage: number
  total_cost: number
  status: string
  quote_data: any
  expires_at: string
  created_at: string
  updated_at: string
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch quote")
        }
        const data = await response.json()
        setQuote(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quote")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuote()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Quote not found"}</p>
          <Button onClick={() => router.push("/admin/quotes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/quotes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quote Details</h1>
            <p className="text-gray-600">Quote ID: {quote.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
          <Button onClick={() => router.push(`/admin/quotes/${quote.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Quote
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{quote.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p>{quote.customer_email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p>{quote.customer_phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Project Address</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p>{quote.project_address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Square Footage</label>
                <p className="text-lg font-semibold">{quote.square_footage?.toLocaleString()} sq ft</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-lg font-semibold text-green-600">
                  $
                  {typeof quote.total_cost === "object" && quote.total_cost?.toNumber
                    ? quote.total_cost.toNumber().toLocaleString()
                    : Number(quote.total_cost || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
              </div>
            </div>

            {quote.quote_data?.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-700">{quote.quote_data.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p>{new Date(quote.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p>{new Date(quote.updated_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expires</label>
                <p className={new Date(quote.expires_at) < new Date() ? "text-red-600" : ""}>
                  {new Date(quote.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
