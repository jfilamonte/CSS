"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions"
import {
  createCustomer,
  createProject,
  updateProjectProgress,
  updateBusinessSettings,
  sendCustomerEmail,
  updateQuoteStatus,
} from "@/lib/database-actions"
import { createSalesRep, getSalesReps } from "@/lib/database-actions"
import { toast } from "sonner"
import { SalesRepAssignmentService } from "@/lib/sales-rep-assignment"

interface Quote {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  project_address: string
  square_footage: number
  status: string
  created_at: string
  total_cost: number
  package_id: string
  quote_data?: any
  expires_at?: string
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
  is_active: boolean
}

interface Project {
  id: string
  title: string
  description?: string
  customer_id: string
  status: string
  progress_percentage: number
  start_date: string
  estimated_completion: string
  completion_date?: string
  square_footage: number
  project_number: string
  project_address?: string
}

interface Appointment {
  id: string
  customer_id: string
  quote_id?: string
  appointment_type: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: string
  customer_notes?: string
  admin_notes?: string
  created_at: string
}

interface ServicePackage {
  id: string
  name: string
  description: string
  package_type: string
  base_price_per_sqft: number
  is_active: boolean
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([])
  const [salesReps, setSalesReps] = useState<any[]>([])
  const [showNewSalesRepModal, setShowNewSalesRepModal] = useState(false)
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false)
  const [selectedSalesRep, setSelectedSalesRep] = useState<any>(null)
  const [salesRepAvailability, setSalesRepAvailability] = useState<any>({})
  const [blockedTimes, setBlockedTimes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any>(null)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [businessSettings, setBusinessSettings] = useState({
    companyName: "Crafted Surface Solutions",
    phone: "(555) 123-4567",
    email: "info@craftedsurface.com",
    address: "123 Business Ave, City, ST 12345",
  })

  const [workloadData, setWorkloadData] = useState<any[]>([])
  const [showWorkloadModal, setShowWorkloadModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [selectedAppointmentForReassign, setSelectedAppointmentForReassign] = useState<any>(null)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)

  const [calculatedCost, setCalculatedCost] = useState<number>(0)

  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([])
  const [showTimeOffApprovalModal, setShowTimeOffApprovalModal] = useState(false)
  const [selectedTimeOffRequest, setSelectedTimeOffRequest] = useState<any>(null)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showBlockedTimeModal, setShowBlockedTimeModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
    fetchTimeOffRequests()
  }, [])

  const fetchData = async () => {
    try {
      const [
        quotesResult,
        customersResult,
        projectsResult,
        appointmentsResult,
        packagesResult,
        settingsResult,
        rescheduleResult,
        salesRepsResult,
      ] = await Promise.all([
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").eq("role", "customer").order("created_at", { ascending: false }),
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("scheduled_date", { ascending: true }),
        supabase.from("service_packages").select("*").eq("is_active", true),
        supabase.from("business_settings").select("*").eq("setting_category", "business_info"),
        supabase.from("reschedule_requests").select("*, appointments(*)").eq("status", "pending"),
        supabase.from("users").select("*").eq("role", "admin").order("created_at", { ascending: false }),
      ])

      if (quotesResult.data) setQuotes(quotesResult.data)
      if (customersResult.data) setCustomers(customersResult.data)
      if (projectsResult.data) setProjects(projectsResult.data)
      if (appointmentsResult.data) setAppointments(appointmentsResult.data)
      if (packagesResult.data) setServicePackages(packagesResult.data)
      if (rescheduleResult.data) setRescheduleRequests(rescheduleResult.data)
      if (salesRepsResult.data) setSalesReps(salesRepsResult.data)

      if (settingsResult.data) {
        const settings = settingsResult.data.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = setting.setting_value
          return acc
        }, {})
        setBusinessSettings({
          companyName: settings.company_name || "Crafted Surface Solutions",
          phone: settings.phone || "(555) 123-4567",
          email: settings.email || "info@craftedsurface.com",
          address: settings.address || "123 Business Ave, City, ST 12345",
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkloadData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const result = await SalesRepAssignmentService.getAvailableRepsWithWorkload(today, "10:00")

      if (result.success && result.reps) {
        setWorkloadData(result.reps)
      }
    } catch (error) {
      console.error("Error loading workload data:", error)
    }
  }

  const handleIntelligentReassign = async (appointmentId: string) => {
    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId)
      if (!appointment) return

      const result = await SalesRepAssignmentService.assignSalesRep({
        date: appointment.scheduled_date,
        time: appointment.scheduled_time,
        duration: appointment.duration_minutes,
        appointmentType: appointment.appointment_type,
        customerId: appointment.customer_id,
      })

      if (result.success && result.assignedRepId) {
        const { error } = await supabase
          .from("appointments")
          .update({
            assigned_to: result.assignedRepId,
            admin_notes: `Intelligently reassigned to ${result.assignedRepName}: ${result.reason}`,
          })
          .eq("id", appointmentId)

        if (!error) {
          toast.success(`Appointment reassigned to ${result.assignedRepName}`)
          loadAppointments()
        }
      } else {
        toast.error(result.error || "Failed to reassign appointment")
      }
    } catch (error) {
      console.error("Error reassigning appointment:", error)
      toast.error("Failed to reassign appointment")
    }
  }

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("scheduled_date", { ascending: true })

      if (data) {
        setAppointments(data)
      }

      if (error) {
        console.error("Error fetching appointments:", error)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  const handleApproveTimeOff = async (requestId: string, status: "approved" | "rejected", adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from("sales_rep_time_off")
        .update({
          status,
          admin_notes: adminNotes,
          approved_at: status === "approved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      const request = timeOffRequests.find((req) => req.id === requestId)
      if (request) {
        await fetch("/api/send-time-off-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salesRepEmail: request.sales_rep.email,
            salesRepName: `${request.sales_rep.first_name} ${request.sales_rep.last_name}`,
            status,
            startDate: request.start_date,
            endDate: request.end_date,
            type: request.type,
            adminNotes,
          }),
        })
      }

      await fetchTimeOffRequests()
      setShowTimeOffApprovalModal(false)
      toast.success(`Time off request ${status}`)
    } catch (error) {
      console.error("Error updating time off request:", error)
      toast.error("Failed to update time off request")
    }
  }

  const fetchTimeOffRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_rep_time_off")
        .select(`
          *,
          sales_rep:users!sales_rep_time_off_sales_rep_id_fkey(
            first_name, last_name, email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.log("Time off table not yet created, showing empty state")
          setTimeOffRequests([])
          return
        }
        throw error
      }
      setTimeOffRequests(data || [])
    } catch (error) {
      console.error("Error fetching time off requests:", error)
      setTimeOffRequests([])
    }
  }

  const handleUpdateQuoteStatus = async (id: string, status: string) => {
    console.log("[v0] Attempting to update quote status:", { id, status })
    try {
      const result = await updateQuoteStatus(id, status)
      if (result.success) {
        setQuotes(quotes.map((quote) => (quote.id === id ? { ...quote, status } : quote)))
      } else {
        console.log("[v0] Quote status update failed:", result.error)
        alert(result.error || "Failed to update quote status")
      }
    } catch (error) {
      console.error("Error updating quote status:", error)
      alert("Failed to update quote status")
    }
  }

  const handleCreateCustomer = async (formData: FormData) => {
    const result = await createCustomer(formData)
    if (result.success) {
      setCustomers([result.data, ...customers])
      setShowNewCustomerModal(false)
    } else {
      alert(result.error)
    }
  }

  const handleCreateProject = async (formData: FormData) => {
    const result = await createProject(formData)
    if (result.success) {
      setProjects([result.data, ...projects])
      setShowNewProjectModal(false)
    } else {
      alert(result.error)
    }
  }

  const handleUpdateProjectProgress = async (id: string, progress: number) => {
    try {
      console.log("[v0] Updating project progress:", { id, progress })
      const result = await updateProjectProgress(id, progress)
      console.log("[v0] Update result:", result)

      if (result && result.success) {
        setProjects(
          projects.map((project) => (project.id === id ? { ...project, progress_percentage: progress } : project)),
        )
      } else {
        const errorMessage = result?.error || "Unknown error occurred"
        console.error("[v0] Update failed:", errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Exception in handleUpdateProjectProgress:", error)
      alert("Failed to update project progress")
    }
  }

  const handleSendEmail = async () => {
    if (!selectedCustomer) return

    const result = await sendCustomerEmail(selectedCustomer.id, emailSubject, emailMessage)
    if (result.success) {
      alert(result.message)
      setShowEmailModal(false)
      setEmailSubject("")
      setEmailMessage("")
    } else {
      alert(result.error)
    }
  }

  const handleSaveBusinessSettings = async (formData: FormData) => {
    const result = await updateBusinessSettings(formData)
    if (result.success) {
      alert("Business settings saved successfully!")
    } else {
      alert(result.error)
    }
  }

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id)

      if (error) throw error

      setQuotes(quotes.filter((quote) => quote.id !== id))
    } catch (error) {
      console.error("Error deleting quote:", error)
    }
  }

  const updateCustomerStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", id)

      if (error) throw error

      setCustomers(customers.map((customer) => (customer.id === id ? { ...customer, is_active: isActive } : customer)))
    } catch (error) {
      console.error("Error updating customer status:", error)
    }
  }

  const exportData = async () => {
    try {
      const data = {
        quotes,
        customers,
        projects,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `css-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const sendCustomerEmail = async (customerEmail: string) => {
    console.log(`Sending email to ${customerEmail}`)
    alert(`Email functionality would send to: ${customerEmail}`)
  }

  const saveBusinessSettings = async () => {
    try {
      console.log("Saving business settings:", businessSettings)
      alert("Business settings saved successfully!")
    } catch (error) {
      console.error("Error saving business settings:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      approved: { label: "Approved", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
      completed: { label: "Completed", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project_address?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSignOut = async () => {
    await signOut()
  }

  const handleRescheduleApproval = async (
    requestId: string,
    appointmentId: string,
    newDate: string,
    newTime: string,
  ) => {
    try {
      await supabase
        .from("appointments")
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          status: "scheduled",
          admin_notes: "Reschedule approved and updated",
        })
        .eq("id", appointmentId)

      await supabase.from("reschedule_requests").update({ status: "approved" }).eq("id", requestId)

      await fetchData()
    } catch (error) {
      console.error("Error approving reschedule:", error)
    }
  }

  const handleRescheduleRejection = async (requestId: string, appointmentId: string, reason: string) => {
    try {
      await supabase
        .from("appointments")
        .update({
          status: "scheduled",
          admin_notes: `Reschedule request denied: ${reason}`,
        })
        .eq("id", appointmentId)

      await supabase.from("reschedule_requests").update({ status: "rejected", admin_notes: reason }).eq("id", requestId)

      await fetchData()
    } catch (error) {
      console.error("Error rejecting reschedule:", error)
    }
  }

  const initiateAdminReschedule = async (appointmentId: string, newDate: string, newTime: string, reason: string) => {
    try {
      await supabase
        .from("appointments")
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          admin_notes: `Rescheduled by admin: ${reason}`,
        })
        .eq("id", appointmentId)

      await fetchData()
      setShowRescheduleModal(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
    }
  }

  const handleEditQuote = async (formData: FormData) => {
    if (!editingQuote) return

    try {
      const updatedData = {
        customer_name: formData.get("customer_name") as string,
        customer_email: formData.get("customer_email") as string,
        customer_phone: formData.get("customer_phone") as string,
        project_address: formData.get("project_address") as string,
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        total_cost: Number.parseFloat(formData.get("total_cost") as string),
        status: formData.get("status") as string,
      }

      const { error } = await supabase.from("quotes").update(updatedData).eq("id", editingQuote.id)

      if (error) throw error

      await fetchData()
      setShowEditQuoteModal(false)
      setEditingQuote(null)
      setCalculatedCost(0)
    } catch (error) {
      console.error("Error updating quote:", error)
    }
  }

  const calculateCostFromSquareFootage = async (squareFootage: number, packageId?: string) => {
    try {
      let pricePerSqft = 8.5

      if (packageId) {
        const { data: packageData } = await supabase
          .from("service_packages")
          .select("base_price_per_sqft")
          .eq("id", packageId)
          .single()

        if (packageData) {
          pricePerSqft = packageData.base_price_per_sqft
        }
      }

      return squareFootage * pricePerSqft
    } catch (error) {
      console.error("Error calculating cost:", error)
      return squareFootage * 8.5
    }
  }

  const handleEditCustomer = async (formData: FormData) => {
    if (!editingCustomer) return

    try {
      const updatedData = {
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip_code: formData.get("zip_code") as string,
      }

      const { error } = await supabase.from("users").update(updatedData).eq("id", editingCustomer.id)

      if (error) throw error

      await fetchData()
      setShowEditCustomerModal(false)
      setEditingCustomer(null)
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }

  const handleResetCustomerPassword = async (customerId: string, email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      alert("Password reset email sent successfully!")
    } catch (error) {
      console.error("Error sending password reset:", error)
      alert("Error sending password reset email")
    }
  }

  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    try {
      await supabase
        .from("appointments")
        .update({
          status: action,
          admin_notes: `Appointment ${action} by admin`,
        })
        .eq("id", appointmentId)

      await fetchData()
    } catch (error) {
      console.error(`Error ${action} appointment:`, error)
    }
  }

  const handleEditProject = async (formData: FormData) => {
    if (!editingProject) return

    try {
      const updatedData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        project_address: formData.get("project_address") as string,
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        start_date: formData.get("start_date") as string,
        estimated_completion: formData.get("estimated_completion") as string,
      }

      const { error } = await supabase.from("projects").update(updatedData).eq("id", editingProject.id)

      if (error) throw error

      await fetchData()
      setShowEditProjectModal(false)
      setEditingProject(null)
    } catch (error) {
      console.error("Error updating project:", error)
    }
  }

  const validateSalesRepForm = (formData: FormData): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {}

    const firstName = formData.get("firstName")?.toString().trim()
    const lastName = formData.get("lastName")?.toString().trim()
    const email = formData.get("email")?.toString().trim()
    const phone = formData.get("phone")?.toString().trim()
    const password = formData.get("password")?.toString()

    if (!firstName || firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters"
    }

    if (!lastName || lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters"
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!phone || !/^$$?(\d{3})$$?[-. ]?(\d{3})[-. ]?(\d{4})$/.test(phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }

    return { isValid: Object.keys(errors).length === 0, errors }
  }

  const validateAvailabilityData = (availability: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    Object.entries(availability).forEach(([day, times]: [string, any]) => {
      if (times.enabled && times.startTime && times.endTime) {
        const start = new Date(`2000-01-01T${times.startTime}`)
        const end = new Date(`2000-01-01T${times.endTime}`)

        if (start >= end) {
          errors.push(`${day}: Start time must be before end time`)
        }

        if (start.getHours() < 6 || end.getHours() > 22) {
          errors.push(`${day}: Hours must be between 6:00 AM and 10:00 PM`)
        }
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  const handleCreateSalesRep = async (formData: FormData) => {
    setIsSubmitting(true)
    setErrors({})
    setGlobalError("")

    try {
      const validation = validateSalesRepForm(formData)
      if (!validation.isValid) {
        setErrors(validation.errors)
        return
      }

      console.log("[v0] Creating sales rep with validated form data")

      const result = await createSalesRep(formData)

      if (!result.success) {
        if (result.error.includes("already exists")) {
          setErrors({ email: "A user with this email already exists" })
        } else if (result.error.includes("constraint")) {
          setErrors({ form: "Invalid data provided. Please check all fields." })
        } else {
          setGlobalError(result.error)
        }
        return
      }

      toast.success("Sales representative created successfully!")
      setShowNewSalesRepModal(false)
      setErrors({})
      await loadSalesReps()
    } catch (error: any) {
      console.error("[v0] Error creating sales rep:", error)
      setGlobalError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadSalesReps = async () => {
    try {
      const result = await getSalesReps()
      setSalesReps(result.data)
    } catch (error) {
      console.error("Error loading sales reps:", error)
      setSalesReps([])
    }
  }

  const handleSaveAvailability = async () => {
    if (!selectedSalesRep) return

    try {
      const validation = validateAvailabilityData(salesRepAvailability)
      if (!validation.isValid) {
        setValidationErrors({ availability: validation.errors })
        toast.error("Please fix the validation errors before saving")
        return
      }

      setValidationErrors({})

      await supabase.from("sales_rep_availability").delete().eq("sales_rep_id", selectedSalesRep.id)

      const availabilityData = []
      for (const [day, times] of Object.entries(salesRepAvailability)) {
        if (times.enabled && times.startTime && times.endTime) {
          availabilityData.push({
            sales_rep_id: selectedSalesRep.id,
            day_of_week: day.toLowerCase(),
            start_time: times.startTime,
            end_time: times.endTime,
            is_active: true,
          })
        }
      }

      if (availabilityData.length > 0) {
        const { error } = await supabase.from("sales_rep_availability").insert(availabilityData)
        if (error) throw error
      }

      setShowAvailabilityModal(false)
      toast.success("Availability updated successfully")
    } catch (error: any) {
      console.error("Error saving availability:", error)
      toast.error(`Failed to save availability: ${error.message || "Unknown error"}`)
    }
  }

  const handleAddBlockedTime = async (formData: FormData) => {
    try {
      if (!selectedSalesRep) {
        toast.error("No sales representative selected")
        return
      }

      const blockedDate = formData.get("blocked_date") as string
      const startTime = formData.get("start_time") as string
      const endTime = formData.get("end_time") as string
      const reason = formData.get("reason") as string
      const isAllDay = formData.get("is_all_day") === "on"

      if (!blockedDate) {
        toast.error("Please select a date")
        return
      }

      if (!isAllDay && (!startTime || !endTime)) {
        toast.error("Please specify start and end times")
        return
      }

      if (!isAllDay && startTime >= endTime) {
        toast.error("Start time must be before end time")
        return
      }

      if (!reason || reason.trim().length < 3) {
        toast.error("Please provide a reason (at least 3 characters)")
        return
      }

      const selectedDate = new Date(blockedDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        toast.error("Cannot block time in the past")
        return
      }

      const blockedTimeData = {
        sales_rep_id: selectedSalesRep.id,
        blocked_date: blockedDate,
        start_time: isAllDay ? null : startTime,
        end_time: isAllDay ? null : endTime,
        reason: reason.trim(),
        is_all_day: isAllDay,
      }

      const { data, error } = await supabase.from("sales_rep_blocked_times").insert([blockedTimeData]).select().single()

      if (error) throw error

      setBlockedTimes([...blockedTimes, data])
      setShowBlockedTimeModal(false)
      toast.success("Blocked time added successfully")
    } catch (error: any) {
      console.error("Error adding blocked time:", error)
      toast.error(`Failed to add blocked time: ${error.message || "Unknown error"}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">CSS</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="sales-reps">Sales Reps</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Quotes</h3>
                <p className="text-3xl font-bold text-blue-600">{quotes.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
                <p className="text-3xl font-bold text-green-600">
                  {projects.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Total Customers</h3>
                <p className="text-3xl font-bold text-purple-600">{customers.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">Sales Reps</h3>
                <p className="text-3xl font-bold text-orange-600">{salesReps.length}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="quotes">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quotes Management</h2>
              <p className="text-gray-600">Quotes content will be displayed here.</p>
            </div>
          </TabsContent>
          <TabsContent value="customers">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Customer Management</h2>
              <p className="text-gray-600">Customer content will be displayed here.</p>
            </div>
          </TabsContent>
          <TabsContent value="projects">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Project Management</h2>
              <p className="text-gray-600">Project content will be displayed here.</p>
            </div>
          </TabsContent>
          <TabsContent value="appointments">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Appointment Management</h2>
              <p className="text-gray-600">Appointment content will be displayed here.</p>
            </div>
          </TabsContent>
          <TabsContent value="sales-reps">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Sales Representative Management</h2>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Manage your sales team and their availability.</p>
                <Button onClick={() => setShowNewSalesRepModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  Add Sales Rep
                </Button>
              </div>

              {salesReps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sales representatives found.</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first sales rep to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {salesReps.map((rep) => (
                    <div key={rep.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold">
                        {rep.first_name} {rep.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{rep.email}</p>
                      <p className="text-sm text-gray-600">{rep.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          Availability
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <p className="text-gray-600">Settings content will be displayed here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
