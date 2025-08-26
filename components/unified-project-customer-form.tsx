"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
}

interface UnifiedProjectCustomerFormProps {
  onSuccess?: () => void
  existingCustomers?: Customer[]
}

const UnifiedProjectCustomerForm = ({ onSuccess, existingCustomers = [] }: UnifiedProjectCustomerFormProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing")

  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
  })

  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    location: "",
    square_footage: "",
    project_type: "",
    budget_range: "",
    timeline: "",
    customer_id: "",
  })

  const handleCustomerSubmit = async () => {
    if (!customerData.name || !customerData.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      })
      return null
    }

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      const result = await response.json()
      return result.customer
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      })
      return null
    }
  }

  const handleProjectSubmit = async (customerId: string) => {
    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectData,
          customer_id: customerId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
      return null
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let customerId = projectData.customer_id

      if (customerMode === "new") {
        const newCustomer = await handleCustomerSubmit()
        if (!newCustomer) {
          setLoading(false)
          return
        }
        customerId = newCustomer.id
      }

      if (!customerId) {
        toast({
          title: "Error",
          description: "Please select or create a customer",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create project
      const project = await handleProjectSubmit(customerId)
      if (project) {
        toast({
          title: "Success",
          description: "Project and customer created successfully!",
          variant: "default",
        })
        onSuccess?.()
      }
    } catch (error) {
      console.error("Error in unified form:", error)
      toast({
        title: "Error",
        description: "Failed to create project and customer",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={customerMode} onValueChange={(value) => setCustomerMode(value as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing Customer</TabsTrigger>
              <TabsTrigger value="new">New Customer</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              <div>
                <Label htmlFor="customer_select">Select Customer</Label>
                <Select
                  value={projectData.customer_id}
                  onValueChange={(value) => setProjectData({ ...projectData, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_phone">Phone</Label>
                  <Input
                    id="customer_phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_company">Company</Label>
                  <Input
                    id="customer_company"
                    value={customerData.company}
                    onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_address">Address</Label>
                <Textarea
                  id="customer_address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Project Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_title">Project Title *</Label>
                <Input
                  id="project_title"
                  value={projectData.title}
                  onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <Label htmlFor="project_type">Project Type</Label>
                <Select
                  value={projectData.project_type}
                  onValueChange={(value) => setProjectData({ ...projectData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="project_description">Description</Label>
              <Textarea
                id="project_description"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="project_location">Location</Label>
                <Input
                  id="project_location"
                  value={projectData.location}
                  onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                  placeholder="Project location"
                />
              </div>
              <div>
                <Label htmlFor="square_footage">Square Footage</Label>
                <Input
                  id="square_footage"
                  value={projectData.square_footage}
                  onChange={(e) => setProjectData({ ...projectData, square_footage: e.target.value })}
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <Label htmlFor="budget_range">Budget Range</Label>
                <Select
                  value={projectData.budget_range}
                  onValueChange={(value) => setProjectData({ ...projectData, budget_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5k">Under $5,000</SelectItem>
                    <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="over-50k">Over $50,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Project & Customer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { UnifiedProjectCustomerForm }
