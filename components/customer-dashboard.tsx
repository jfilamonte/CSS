"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { signOut } from "@/lib/actions"
import Image from "next/image"
import {
  FileText,
  Calendar,
  Building,
  LogOut,
  Phone,
  Mail,
  Clock,
  DollarSign,
  UserIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Plus,
  Save,
  Edit,
  X,
  MessageSquare,
  Eye,
  Download,
  CreditCard,
  Users,
  CalendarDays,
  Receipt,
  Shield,
  Gift,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react"
import type { LeadWithRelations, QuoteWithRelations, ProjectWithRelations, UserWithRelations } from "@/lib/types"

interface CustomerStats {
  activeQuotes: number
  activeProjects: number
  upcomingAppointments: number
  totalInvestment: number
  referralCount: number
  referralEarnings: number
}

interface Appointment {
  id: string
  date: string
  time: string
  type: string
  status: string
  staff: string
  notes?: string
}

interface Invoice {
  id: string
  number: string
  amount: number
  status: string
  dueDate: string
  paidDate?: string
  downloadUrl?: string
}

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  downloadUrl: string
  size: string
}

interface ProjectPhoto {
  id: string
  url: string
  caption: string
  uploadDate: string
  phase: string
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<CustomerStats>({
    activeQuotes: 0,
    activeProjects: 0,
    upcomingAppointments: 0,
    totalInvestment: 0,
    referralCount: 0,
    referralEarnings: 0,
  })
  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([])
  const [customerInfo, setCustomerInfo] = useState<UserWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  const [appointmentForm, setAppointmentForm] = useState({
    date: "",
    time: "",
    type: "consultation",
    notes: "",
  })
  const [referralCode, setReferralCode] = useState("")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [quoteFormData, setQuoteFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    projectType: "",
    squareFootage: "",
    timeline: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    details: "",
    wantsAppointment: false,
  })
  const [settingsData, setSettingsData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    try {
      // Load customer profile
      const profileResponse = await fetch("/api/customer/profile")
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setCustomerInfo(profileData)
        setSettingsData({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          city: profileData.city || "",
          state: profileData.state || "",
          zipCode: profileData.zipCode || "",
        })
        setQuoteFormData((prev) => ({
          ...prev,
          fullName: `${profileData.firstName} ${profileData.lastName}`,
          email: profileData.email,
          phone: profileData.phone || "",
        }))
      }

      // Load customer stats
      const statsResponse = await fetch("/api/customer/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load customer leads
      const leadsResponse = await fetch("/api/customer/leads")
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeads(leadsData)
      }

      // Load customer quotes
      const quotesResponse = await fetch("/api/customer/quotes")
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json()
        setQuotes(quotesData)
      }

      // Load customer projects
      const projectsResponse = await fetch("/api/customer/projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }

      // Load appointments
      const appointmentsResponse = await fetch("/api/customer/appointments")
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData)
      }

      // Load invoices
      const invoicesResponse = await fetch("/api/customer/invoices")
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData)
      }

      // Load documents
      const documentsResponse = await fetch("/api/customer/documents")
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        setDocuments(documentsData)
      }

      // Load project photos
      const photosResponse = await fetch("/api/customer/project-photos")
      if (photosResponse.ok) {
        const photosData = await photosResponse.json()
        setProjectPhotos(photosData)
      }

      // Load referral code
      const referralResponse = await fetch("/api/customer/referral-code")
      if (referralResponse.ok) {
        const referralData = await referralResponse.json()
        setReferralCode(referralData.code)
      }

      // ... existing profile, stats, leads, quotes, projects loading ...
    } catch (error) {
      console.error("Error loading customer data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/customer/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentForm),
      })

      if (!response.ok) throw new Error("Failed to book appointment")

      await loadCustomerData()
      setAppointmentForm({ date: "", time: "", type: "consultation", notes: "" })
      alert("Appointment booked successfully!")
    } catch (error) {
      console.error("Error booking appointment:", error)
      alert("Error booking appointment. Please try again.")
    }
  }

  const handlePayment = async (invoiceId: string) => {
    try {
      const response = await fetch("/api/customer/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      })

      if (!response.ok) throw new Error("Failed to create payment intent")

      const { clientSecret } = await response.json()
      // Redirect to Stripe checkout or handle payment flow
      window.location.href = `/payment?client_secret=${clientSecret}&invoice_id=${invoiceId}`
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Error processing payment. Please try again.")
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    alert("Referral code copied to clipboard!")
  }

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingQuote(true)

    try {
      const response = await fetch("/api/customer/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteFormData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit quote request")
      }

      // Reset form
      setQuoteFormData({
        fullName: `${customerInfo?.firstName} ${customerInfo?.lastName}`,
        email: customerInfo?.email || "",
        phone: customerInfo?.phone || "",
        projectType: "",
        squareFootage: "",
        timeline: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        details: "",
        wantsAppointment: false,
      })

      // Refresh data
      await loadCustomerData()

      // Switch to quotes tab
      setActiveTab("quotes")

      alert("Quote request submitted successfully! We'll review your request and get back to you soon.")
    } catch (error) {
      console.error("Error submitting quote:", error)
      alert("Error submitting quote request. Please try again.")
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingSettings(true)

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      await loadCustomerData()
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile. Please try again.")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { label: "New", variant: "secondary" as const, icon: Clock },
      CONTACTED: { label: "Contacted", variant: "default" as const, icon: Phone },
      ESTIMATE_SENT: { label: "Estimate Sent", variant: "default" as const, icon: FileText },
      SCHEDULED: { label: "Scheduled", variant: "default" as const, icon: Calendar },
      CLOSED_WON: { label: "Approved", variant: "default" as const, icon: CheckCircle },
      CLOSED_LOST: { label: "Declined", variant: "destructive" as const, icon: X },
      DRAFT: { label: "Draft", variant: "secondary" as const, icon: Edit },
      SENT: { label: "Sent", variant: "default" as const, icon: Mail },
      VIEWED: { label: "Viewed", variant: "default" as const, icon: Eye },
      ACCEPTED: { label: "Accepted", variant: "default" as const, icon: CheckCircle },
      REJECTED: { label: "Rejected", variant: "destructive" as const, icon: X },
      PLANNING: { label: "Planning", variant: "secondary" as const, icon: Calendar },
      IN_PROGRESS: { label: "In Progress", variant: "default" as const, icon: Building },
      COMPLETED: { label: "Completed", variant: "default" as const, icon: CheckCircle },
      ON_HOLD: { label: "On Hold", variant: "secondary" as const, icon: Clock },
      CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: X },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      icon: AlertCircle,
    }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  // ... existing handlers and utility functions ...

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative">
                <Image src="/css-logo.png" alt="Crafted Surface Solutions Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {customerInfo?.firstName} {customerInfo?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <p className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  (555) 123-4567
                </p>
                <p className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  info@craftedsurface.com
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Quotes</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeQuotes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Investment</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">${stats.totalInvestment.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.referralCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">${stats.referralEarnings}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress</CardTitle>
                  <CardDescription>Current project status with photos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects
                      .filter((p) => p.status === "IN_PROGRESS")
                      .slice(0, 2)
                      .map((project) => (
                        <div key={project.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium">{project.title}</p>
                            <Badge variant="secondary">In Progress</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {projectPhotos
                              .filter((photo) => photo.id.includes(project.id))
                              .slice(0, 3)
                              .map((photo) => (
                                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                                  <Image
                                    src={photo.url || "/placeholder.svg"}
                                    alt={photo.caption}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                          </div>

                          <Progress value={75} className="h-2 mb-2" />
                          <p className="text-xs text-gray-500">
                            Est. completion: {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Recent quotes */}
                    {leads.slice(0, 2).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Quote Request</p>
                          <p className="text-xs text-gray-600">{lead.address}</p>
                        </div>
                        {getStatusBadge(lead.status)}
                      </div>
                    ))}

                    {/* Recent appointments */}
                    {appointments.slice(0, 2).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Appointment</p>
                          <p className="text-xs text-gray-600">
                            {apt.date} at {apt.time}
                          </p>
                        </div>
                        <Badge variant="outline">{apt.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Quotes</h2>
              <p className="text-gray-600">View and manage your quote requests</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Details</TableHead>
                      <TableHead>Square Footage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.projectType}</p>
                            <p className="text-sm text-gray-600">{lead.address}</p>
                          </div>
                        </TableCell>
                        <TableCell>{lead.squareFootage} sq ft</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {lead.status === "NEW" && (
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {leads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No quotes found.{" "}
                          <Button variant="link" onClick={() => setActiveTab("request-quote")}>
                            Request your first quote
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request Quote Tab */}
          <TabsContent value="request-quote" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request a Quote</h2>
              <p className="text-gray-600">Get a personalized quote for your epoxy flooring project</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Tell us about your epoxy flooring project</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuoteSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="projectType">Project Type *</Label>
                      <Select
                        value={quoteFormData.projectType}
                        onValueChange={(value) => setQuoteFormData({ ...quoteFormData, projectType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residential Garage">Residential Garage</SelectItem>
                          <SelectItem value="Commercial Warehouse">Commercial Warehouse</SelectItem>
                          <SelectItem value="Basement">Basement</SelectItem>
                          <SelectItem value="Showroom">Showroom</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="squareFootage">Square Footage *</Label>
                      <Input
                        id="squareFootage"
                        type="number"
                        value={quoteFormData.squareFootage}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, squareFootage: e.target.value })}
                        placeholder="1000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address">Project Address *</Label>
                      <Input
                        id="address"
                        value={quoteFormData.address}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, address: e.target.value })}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Desired Timeline</Label>
                      <Select
                        value={quoteFormData.timeline}
                        onValueChange={(value) => setQuoteFormData({ ...quoteFormData, timeline: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASAP">ASAP</SelectItem>
                          <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                          <SelectItem value="1 month">Within 1 month</SelectItem>
                          <SelectItem value="2-3 months">2-3 months</SelectItem>
                          <SelectItem value="Flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={quoteFormData.city}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, city: e.target.value })}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={quoteFormData.state}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, state: e.target.value })}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        value={quoteFormData.zipCode}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, zipCode: e.target.value })}
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="details">Project Description</Label>
                    <Textarea
                      id="details"
                      value={quoteFormData.details}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, details: e.target.value })}
                      placeholder="Describe your project, any specific requirements, current floor condition, etc."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wantsAppointment"
                      checked={quoteFormData.wantsAppointment}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, wantsAppointment: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="wantsAppointment">I would like to schedule a consultation appointment</Label>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingQuote} className="bg-green-700 hover:bg-green-800">
                      {isSubmittingQuote ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Submit Quote Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
              <p className="text-gray-600">Track your active and completed projects with progress photos</p>
            </div>

            <div className="grid gap-6">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>
                          {project.address}, {project.city}, {project.state} • {project.squareFootage?.toLocaleString()}{" "}
                          sq ft
                        </CardDescription>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Project Timeline</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              Started: {project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD"}
                            </span>
                            <span>
                              Est. completion:{" "}
                              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Progress Photos</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {projectPhotos
                            .filter((photo) => photo.id.includes(project.id))
                            .slice(0, 8)
                            .map((photo) => (
                              <Dialog key={photo.id}>
                                <DialogTrigger asChild>
                                  <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80">
                                    <Image
                                      src={photo.url || "/placeholder.svg"}
                                      alt={photo.caption}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>{photo.caption}</DialogTitle>
                                    <DialogDescription>
                                      {photo.phase} • {new Date(photo.uploadDate).toLocaleDateString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="relative aspect-video">
                                    <Image
                                      src={photo.url || "/placeholder.svg"}
                                      alt={photo.caption}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
                <p className="text-gray-600">Schedule and manage your appointments</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-700 hover:bg-green-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Book New Appointment</DialogTitle>
                    <DialogDescription>Schedule a consultation or project meeting</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAppointmentBooking} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={appointmentForm.date}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Select
                          value={appointmentForm.time}
                          onValueChange={(value) => setAppointmentForm({ ...appointmentForm, time: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="13:00">1:00 PM</SelectItem>
                            <SelectItem value="14:00">2:00 PM</SelectItem>
                            <SelectItem value="15:00">3:00 PM</SelectItem>
                            <SelectItem value="16:00">4:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Appointment Type</Label>
                      <Select
                        value={appointmentForm.type}
                        onValueChange={(value) => setAppointmentForm({ ...appointmentForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Initial Consultation</SelectItem>
                          <SelectItem value="estimate">On-site Estimate</SelectItem>
                          <SelectItem value="project_review">Project Review</SelectItem>
                          <SelectItem value="final_walkthrough">Final Walkthrough</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={appointmentForm.notes}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                        placeholder="Any specific requirements or questions..."
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">
                      Book Appointment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{appointment.date}</p>
                            <p className="text-sm text-gray-600">{appointment.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.type}</Badge>
                        </TableCell>
                        <TableCell>{appointment.staff}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Reschedule
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoices & Payments</h2>
              <p className="text-gray-600">View and pay your invoices securely</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <p className="font-medium">{invoice.number}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {invoice.status !== "paid" && (
                              <Button
                                size="sm"
                                className="bg-green-700 hover:bg-green-800"
                                onClick={() => handlePayment(invoice.id)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Pay Now
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document Center</h2>
              <p className="text-gray-600">Access your contracts, warranties, and project documents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <Card key={document.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-gray-600">{document.type}</p>
                          <p className="text-xs text-gray-500">{document.size}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-xs text-gray-500">{new Date(document.uploadDate).toLocaleDateString()}</p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Referral Program</h2>
              <p className="text-gray-600">Earn rewards by referring friends and family</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Code</CardTitle>
                  <CardDescription>Share this code with friends to earn rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <code className="flex-1 font-mono text-lg">{referralCode}</code>
                    <Button variant="outline" size="sm" onClick={copyReferralCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Social Media
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Stats</CardTitle>
                  <CardDescription>Your referral performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Referrals</span>
                      <span className="font-bold text-2xl">{stats.referralCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Earnings</span>
                      <span className="font-bold text-2xl text-green-600">${stats.referralEarnings}</span>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Earn $100 for each successful referral that completes a project over $2,000
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
              <p className="text-gray-600">Update your profile information</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Keep your contact information up to date</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSettingsUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={settingsData.firstName}
                        onChange={(e) => setSettingsData({ ...settingsData, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={settingsData.lastName}
                        onChange={(e) => setSettingsData({ ...settingsData, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settingsData.email}
                        onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={settingsData.phone}
                        onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settingsData.address}
                      onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={settingsData.city}
                        onChange={(e) => setSettingsData({ ...settingsData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={settingsData.state}
                        onChange={(e) => setSettingsData({ ...settingsData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={settingsData.zipCode}
                        onChange={(e) => setSettingsData({ ...settingsData, zipCode: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdatingSettings} className="bg-green-700 hover:bg-green-800">
                      {isUpdatingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
