"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { signOut } from "@/lib/actions"
import {
  Building,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Gift,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  Settings,
  Users,
  UserIcon,
  X,
  AlertCircle,
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

interface ProjectUpdate {
  id: string
  projectId: string
  title: string
  description: string
  date: string
  photos: string[]
  milestone: string
}

interface CustomerReview {
  id: string
  projectId: string
  rating: number
  comment: string
  date: string
  response?: string
}

interface MaintenanceReminder {
  id: string
  projectId: string
  title: string
  description: string
  dueDate: string
  status: "pending" | "completed" | "overdue"
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

  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([])
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([])
  const [maintenanceReminders, setMaintenanceReminders] = useState<MaintenanceReminder[]>([])
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  })

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

      // Load project updates
      const updatesResponse = await fetch("/api/customer/project-updates")
      if (updatesResponse.ok) {
        const updatesData = await updatesResponse.json()
        setProjectUpdates(updatesData)
      }

      // Load customer reviews
      const reviewsResponse = await fetch("/api/customer/reviews")
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setCustomerReviews(reviewsData)
      }

      // Load maintenance reminders
      const remindersResponse = await fetch("/api/customer/maintenance-reminders")
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json()
        setMaintenanceReminders(remindersData)
      }
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      const response = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit review")

      await loadCustomerData()
      setShowReviewDialog(false)
      setReviewForm({ rating: 5, comment: "" })
      setSelectedProject(null)
      alert("Review submitted successfully!")
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Error submitting review. Please try again.")
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
          <TabsList className="grid w-full grid-cols-9">
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
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Maintenance</span>
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
                <CardHeader>
                  <CardTitle>Earnings</CardTitle>
                  <CardDescription>Referral earnings</CardDescription>
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
                    {projectUpdates.slice(0, 3).map((update) => (
                      <div key={update.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-gray-600">{update.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(update.date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">{update.milestone}</Badge>
                      </div>
                    ))}

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

            {maintenanceReminders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Reminders</CardTitle>
                  <CardDescription>Keep your floors in perfect condition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenanceReminders.slice(0, 3).map((reminder) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{reminder.title}</p>
                          <p className="text-xs text-gray-600">{reminder.description}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={reminder.status === "overdue" ? "destructive" : "secondary"}>
                          {reminder.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
        </Tabs>
      </div>
    </div>
  )
}
