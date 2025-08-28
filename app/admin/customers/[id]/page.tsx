import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, FileText } from "lucide-react"
import Link from "next/link"

async function getCustomer(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/customers/${id}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch customer")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customer:", error)
    return null
  }
}

async function getCustomerProjects(customerId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/projects?customer_id=${customerId}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch customer projects")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customer projects:", error)
    return []
  }
}

async function getCustomerQuotes(customerId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/quotes?customer_id=${customerId}`, {
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error("Failed to fetch customer quotes")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customer quotes:", error)
    return []
  }
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id)
  const projects = await getCustomerProjects(params.id)
  const quotes = await getCustomerQuotes(params.id)

  // Defensive programming to ensure data is always arrays
  const safeProjects = Array.isArray(projects) ? projects : []
  const safeQuotes = Array.isArray(quotes) ? quotes : []

  if (!customer) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h1>
          <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist or has been removed.</p>
          <Link href="/admin-new">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin-new">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-gray-600">Customer Details</p>
          </div>
        </div>
        <Badge variant={customer.status === "active" ? "default" : "secondary"}>{customer.status || "Active"}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Customer contact details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{customer.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{customer.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Since</p>
                  <p className="text-sm text-gray-600">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Projects ({safeProjects.length})</CardTitle>
              <CardDescription>Active and completed projects for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {safeProjects.length > 0 ? (
                <div className="space-y-4">
                  {safeProjects.map((project: any) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{project.address}</span>
                        <span>${project.total_cost?.toLocaleString() || "0"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No projects found for this customer.</p>
              )}
            </CardContent>
          </Card>

          {/* Quotes */}
          <Card>
            <CardHeader>
              <CardTitle>Quotes ({safeQuotes.length})</CardTitle>
              <CardDescription>Quote history and estimates</CardDescription>
            </CardHeader>
            <CardContent>
              {safeQuotes.length > 0 ? (
                <div className="space-y-4">
                  {safeQuotes.map((quote: any) => (
                    <div key={quote.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">Quote #{quote.id.slice(0, 8)}</span>
                        </div>
                        <Badge variant={quote.status === "accepted" ? "default" : "secondary"}>{quote.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                        <span className="font-medium">${quote.total_cost?.toLocaleString() || "0"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No quotes found for this customer.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Projects</span>
                <span className="font-medium">{safeProjects.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Quotes</span>
                <span className="font-medium">{safeQuotes.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="font-medium">
                  ${safeProjects.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-transparent" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Create Quote
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
