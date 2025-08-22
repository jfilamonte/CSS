"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { ErrorLogsViewer } from "@/components/error-logs-viewer"
import {
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Search,
  Plus,
  Eye,
  Edit,
  CalendarIcon,
  Settings,
  Globe,
  MessageSquare,
  Trash2,
  Download,
  Upload,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
} from "lucide-react"
import type {
  LeadWithRelations,
  QuoteWithRelations,
  ProjectWithRelations,
  UserWithRelations,
  LeadStatus,
  QuoteStatus,
} from "@/lib/types"

interface DashboardStats {
  totalLeads: number
  activeQuotes: number
  ongoingProjects: number
  totalRevenue: number
  newLeadsThisWeek: number
  quotesThisWeek: number
  projectsCompletedThisMonth: number
  conversionRate: number
}

interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Appointment {
  id: string
  title: string
  date: Date
  time: string
  customer: string
  staff: string
  type: string
  status: "scheduled" | "completed" | "cancelled"
}

interface SiteSettings {
  companyName: string
  phone: string
  email: string
  address: string
  serviceAreas: string[]
  businessHours: string
  logo: string
}

interface SEOSettings {
  pageTitle: string
  metaDescription: string
  keywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
}

function AdminDashboardNew() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeQuotes: 0,
    ongoingProjects: 0,
    totalRevenue: 0,
    newLeadsThisWeek: 0,
    quotesThisWeek: 0,
    projectsCompletedThisMonth: 0,
    conversionRate: 0,
  })
  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [customers, setCustomers] = useState<UserWithRelations[]>([])
  const [staff, setStaff] = useState<UserWithRelations[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    companyName: "Crafted Surface Solutions",
    phone: "",
    email: "",
    address: "",
    serviceAreas: [],
    businessHours: "",
    logo: "",
  })
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    pageTitle: "",
    metaDescription: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<QuoteLineItem[]>([])
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, leadsRes, quotesRes, projectsRes, customersRes, staffRes, appointmentsRes, siteRes, seoRes] =
        await Promise.all([
          fetch("/api/admin/dashboard-stats"),
          fetch("/api/admin/leads"),
          fetch("/api/admin/quotes"),
          fetch("/api/admin/projects"),
          fetch("/api/admin/customers"),
          fetch("/api/admin/staff"),
          fetch("/api/admin/appointments"),
          fetch("/api/admin/site-settings"),
          fetch("/api/admin/seo-settings"),
        ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (leadsRes.ok) setLeads(await leadsRes.json())
      if (quotesRes.ok) setQuotes(await quotesRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (staffRes.ok) setStaff(await staffRes.json())
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json())
      if (siteRes.ok) setSiteSettings(await siteRes.json())
      if (seoRes.ok) setSeoSettings(await seoRes.json())
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault()
    if (!draggedLead) return

    await updateLeadStatus(draggedLead, newStatus)
    setDraggedLead(null)
  }

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)))
      }
    } catch (error) {
      console.error("Error updating lead:", error)
    }
  }

  const addQuoteLineItem = () => {
    const newItem: QuoteLineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setCurrentQuote([...currentQuote, newItem])
  }

  const updateQuoteLineItem = (id: string, field: keyof QuoteLineItem, value: any) => {
    setCurrentQuote(
      currentQuote.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            updated.total = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      }),
    )
  }

  const removeQuoteLineItem = (id: string) => {
    setCurrentQuote(currentQuote.filter((item) => item.id !== id))
  }

  const getQuoteTotal = () => {
    return currentQuote.reduce((sum, item) => sum + item.total, 0)
  }

  const updateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setQuotes(quotes.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)))
      }
    } catch (error) {
      console.error("Error updating quote:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800"
      case "CONTACTED":
        return "bg-yellow-100 text-yellow-800"
      case "ESTIMATE_SENT":
        return "bg-purple-100 text-purple-800"
      case "SCHEDULED":
        return "bg-orange-100 text-orange-800"
      case "CLOSED_WON":
        return "bg-green-100 text-green-800"
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "SENT":
        return "bg-blue-100 text-blue-800"
      case "VIEWED":
        return "bg-yellow-100 text-yellow-800"
      case "ACCEPTED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "PLANNING":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "ON_HOLD":
        return "bg-orange-100 text-orange-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewLead = async (leadId: string) => {
    try {
      router.push(`/admin/leads/${leadId}`)
    } catch (error) {
      console.error("[v0] ERROR:", error.message, { action: "viewLead", leadId })
    }
  }

  const handleEditLead = async (leadId: string) => {
    try {
      router.push(`/admin/leads/${leadId}/edit`)
    } catch (error) {
      console.error("[v0] ERROR:", error.message, { action: "editLead", leadId })
    }
  }

  const handleViewQuote = (quoteId: string) => {
    router.push(`/admin/quotes/${quoteId}`)
  }

  const handleEditQuote = (quoteId: string) => {
    router.push(`/admin/quotes/${quoteId}/edit`)
  }

  const handleDownloadQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/download`)
      if (!response.ok) throw new Error("Failed to download quote")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quote-${quoteId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] ERROR:", error.message, { action: "downloadQuote", quoteId })
      alert("Failed to download quote. Please try again.")
    }
  }

  const handleViewProject = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`)
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/admin/projects/${projectId}/edit`)
  }

  const handleProjectMessage = (projectId: string) => {
    router.push(`/admin/projects/${projectId}/messages`)
  }

  const handleViewCustomer = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`)
  }

  const handleEditCustomer = (customerId: string) => {
    router.push(`/admin/customers/${customerId}/edit`)
  }

  const handleCustomerMessage = (customerId: string) => {
    router.push(`/admin/customers/${customerId}/messages`)
  }

  const handleStaffSchedule = (staffId: string) => {
    router.push(`/admin/staff/${staffId}/schedule`)
  }

  const handleEditStaff = (staffId: string) => {
    router.push(`/admin/staff/${staffId}/edit`)
  }

  const handleImportCustomers = async () => {
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".csv"
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/admin/customers/import", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Import failed")

        alert("Customers imported successfully!")
        fetchData() // Refresh data
      }
      input.click()
    } catch (error) {
      console.error("[v0] ERROR:", error.message, { action: "importCustomers" })
      alert("Failed to import customers. Please try again.")
    }
  }

  const handleUpdateContent = async () => {
    try {
      const response = await fetch("/api/admin/content/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteSettings),
      })

      if (!response.ok) throw new Error("Failed to update content")

      alert("Content updated successfully!")
    } catch (error) {
      console.error("[v0] ERROR:", error.message, { action: "updateContent" })
      alert("Failed to update content. Please try again.")
    }
  }

  const fetchData = async () => {
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
          <p className="text-green-600">Comprehensive CRM for Crafted Surface Solutions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showQuoteBuilder} onOpenChange={setShowQuoteBuilder}>
            <DialogTrigger asChild>
              <Button className="bg-green-700 hover:bg-green-800">
                <FileText className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Quote Builder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Line Items</Label>
                    <Button onClick={addQuoteLineItem} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {currentQuote.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateQuoteLineItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuoteLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateQuoteLineItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Input value={`$${item.total.toFixed(2)}`} readOnly className="bg-gray-50" />
                      </div>
                      <div className="col-span-1">
                        <Button size="sm" variant="outline" onClick={() => removeQuoteLineItem(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">Total: ${getQuoteTotal().toFixed(2)}</div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowQuoteBuilder(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-green-700 hover:bg-green-800">Save Quote</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setShowNewLeadModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">+{stats.newLeadsThisWeek} this week</p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeQuotes}</div>
            <p className="text-xs text-muted-foreground">+{stats.quotesThisWeek} this week</p>
            <Progress value={60} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ongoingProjects}</div>
            <p className="text-xs text-muted-foreground">{stats.projectsCompletedThisMonth} completed this month</p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.conversionRate}% conversion rate</p>
            <Progress value={stats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="cms">CMS</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <p className="text-sm text-gray-600">Drag leads between stages to update their status</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {["NEW", "CONTACTED", "ESTIMATE_SENT", "SCHEDULED", "CLOSED_WON", "CLOSED_LOST"].map((status) => (
                  <div
                    key={status}
                    className="bg-gray-50 rounded-lg p-4 min-h-[400px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status as LeadStatus)}
                  >
                    <h3 className="font-semibold mb-3 text-center">
                      {status.replace("_", " ")}
                      <Badge variant="secondary" className="ml-2">
                        {leads.filter((lead) => lead.status === status).length}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {leads
                        .filter((lead) => lead.status === status)
                        .map((lead) => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className="bg-white p-3 rounded border cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="font-medium text-sm">{lead.fullName}</div>
                            <div className="text-xs text-gray-600">{lead.projectType}</div>
                            <div className="text-xs text-gray-500">{lead.squareFootage} sq ft</div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleViewLead(lead.id)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditLead(lead.id)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Quote Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    onClick={() => setShowQuoteBuilder(true)}
                    size="sm"
                    className="bg-green-700 hover:bg-green-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Quote
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{quote.title}</h3>
                          <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Quote #{quote.quoteNumber}</p>
                        <p className="text-sm text-gray-600">
                          Customer: {quote.lead.fullName} • {quote.lead.email}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Created: {new Date(quote.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 text-xl">
                          ${quote.totalCost.toNumber().toLocaleString()}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewQuote(quote.id)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditQuote(quote.id)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadQuote(quote.id)}>
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {quotes.length === 0 && <p className="text-center text-gray-500 py-8">No quotes found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Projects Tab with Progress Tracking */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Project #{project.projectNumber}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          Customer: {project.customer.firstName} {project.customer.lastName}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                          <MapPin className="w-3 h-3" />
                          {project.address}, {project.city}, {project.state}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Planning Complete
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              Materials Ordered
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              Installation Pending
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 text-xl mb-2">
                          ${project.quote.totalCost.toNumber().toLocaleString()}
                        </p>
                        {project.startDate && (
                          <p className="text-sm text-gray-500 mb-2">
                            Start: {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleViewProject(project.id)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditProject(project.id)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleProjectMessage(project.id)}>
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-center text-gray-500 py-8">No projects found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Appointments for {selectedDate.toLocaleDateString()}</CardTitle>
                  <Button
                    size="sm"
                    className="bg-green-700 hover:bg-green-800"
                    onClick={() => setShowNewAppointmentModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Appointment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{appointment.title}</h4>
                          <p className="text-sm text-gray-600">{appointment.customer}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.time} • {appointment.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          <p className="text-sm text-gray-500 mt-1">Staff: {appointment.staff}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No appointments scheduled</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Management</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={handleImportCustomers}>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Projects:</strong> 2 completed, 1 active
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">
                          Customer since: {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleViewCustomer(customer.id)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditCustomer(customer.id)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCustomerMessage(customer.id)}>
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {customers.length === 0 && <p className="text-center text-gray-500 py-8">No customers found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Staff Management</CardTitle>
                <Button
                  size="sm"
                  className="bg-green-700 hover:bg-green-800"
                  onClick={() => setShowAddStaffModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {member.firstName} {member.lastName}
                          </h3>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                          <div>
                            <strong>Role:</strong> {member.role}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Title:</strong> {member.title}
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Current Workload</span>
                            <span>8/10 projects</span>
                          </div>
                          <Progress value={80} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">
                          Joined: {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleStaffSchedule(member.id)}>
                            <CalendarIcon className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditStaff(member.id)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {staff.length === 0 && <p className="text-center text-gray-500 py-8">No staff members found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Homepage Hero Title</Label>
                  <Input placeholder="Professional Epoxy Flooring Solutions" />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea placeholder="Transform your space with durable, beautiful epoxy floors" />
                </div>
                <div className="space-y-2">
                  <Label>Services</Label>
                  <div className="space-y-2">
                    <Input placeholder="Garage Floor Coatings" />
                    <Input placeholder="Commercial Flooring" />
                    <Input placeholder="Decorative Concrete" />
                  </div>
                </div>
                <Button className="w-full bg-green-700 hover:bg-green-800" onClick={handleUpdateContent}>
                  Update Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Images
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Error Logs Section */}
            <ErrorLogsViewer />

            {/* Existing Settings Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Business Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={siteSettings.companyName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={siteSettings.phone}
                        onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={siteSettings.email}
                        onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      value={siteSettings.address}
                      onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <Input placeholder="Enter cities separated by commas" />
                  </div>
                  <Button className="w-full bg-green-700 hover:bg-green-800">Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    SEO Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input
                      value={seoSettings.pageTitle}
                      onChange={(e) => setSeoSettings({ ...seoSettings, pageTitle: e.target.value })}
                      placeholder="Professional Epoxy Flooring | Crafted Surface Solutions"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={seoSettings.metaDescription}
                      onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                      placeholder="Transform your space with professional epoxy flooring solutions..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keywords</Label>
                    <Input
                      value={seoSettings.keywords}
                      onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
                      placeholder="epoxy flooring, garage floors, commercial flooring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Open Graph Title</Label>
                    <Input
                      value={seoSettings.ogTitle}
                      onChange={(e) => setSeoSettings({ ...seoSettings, ogTitle: e.target.value })}
                    />
                  </div>
                  <Button className="w-full bg-green-700 hover:bg-green-800">Update SEO</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AdminDashboardNew }
