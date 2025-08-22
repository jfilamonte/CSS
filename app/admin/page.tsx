"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { crypto } from "crypto"

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  project_type: string
  message: string
  status: string
  created_at: string
}

interface Project {
  id: string
  title: string
  customer_id: string
  status: string
  start_date: string
  estimated_completion: string
  progress_percentage: number | null
  square_footage: number | null
  project_address: string | null
  budget?: number | null
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  total_projects: number
}

const logError = (error: Error, context?: any) => {
  console.error("[v0] Error:", error.message, context)
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[v0] Runtime error caught:", event.error)
      setError(event.error)
      setHasError(true)
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Admin Portal Error</h2>
          <p className="text-gray-600 mb-4">Something went wrong loading the admin portal.</p>
          <pre className="text-sm bg-gray-100 p-4 rounded text-left overflow-auto">
            {error?.message || "Unknown error"}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const generateUUID = () => {
  return crypto.randomUUID()
}

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function AdminPage() {
  console.log("[v0] AdminPage component rendering...")

  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
  const [editingItem, setEditingItem] = useState<any>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    console.log("[v0] useEffect for auth check triggered")
    checkAuth()
  }, [])

  useEffect(() => {
    console.log("[v0] useEffect for data loading triggered, loading:", loading)
    if (!loading) {
      loadData()
    }
  }, [loading])

  const checkAuth = async () => {
    try {
      console.log("[v0] Starting auth check...")
      const response = await fetch("/api/auth/user")
      console.log("[v0] Auth response status:", response.status)

      if (!response.ok) {
        console.log("[v0] Auth failed, redirecting to login")
        router.push("/auth/login")
        return
      }

      const userData = await response.json()
      console.log("[v0] User data received:", userData)

      if (!userData.user || !["ADMIN", "STAFF", "admin", "staff"].includes(userData.user.role)) {
        console.log("[v0] User role check failed:", userData.user?.role)
        router.push("/")
        return
      }

      console.log("[v0] Auth successful, loading dashboard")
      setLoading(false)
    } catch (error) {
      console.error("[v0] Auth error:", error)
      logError(error as Error, { context: "Admin auth check" })
      router.push("/auth/login")
    }
  }

  const loadData = async () => {
    try {
      const leadsResponse = await fetch("/api/admin/leads")
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeads(leadsData.leads || [])
      }

      const projectsResponse = await fetch("/api/admin/projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const mappedProjects = (projectsData.projects || []).map((project: any) => ({
          id: project.id,
          title: project.title,
          customer_id: project.customer_id,
          status: project.status,
          start_date: project.start_date,
          estimated_completion: project.estimated_completion,
          progress_percentage: project.progress_percentage,
          square_footage: project.square_footage,
          project_address: project.project_address,
          budget: project.budget,
        }))
        setProjects(mappedProjects)
      }

      const customersResponse = await fetch("/api/admin/users")
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        const customerList =
          customersData.users
            ?.filter((user: any) => user.role === "customer")
            .map((user: any) => ({
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              phone: user.phone,
              address: user.address || "",
              total_projects: 0,
            })) || []
        setCustomers(customerList)
      }
    } catch (error) {
      logError(error as Error, { context: "Loading admin data" })
    }
  }

  const handleCreateLead = async () => {
    if (formData.name && formData.email && formData.phone && formData.square_footage) {
      try {
        console.log("[v0] Creating lead with data:", formData)
        const response = await fetch("/api/admin/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            project_address: formData.project_address || "",
            square_footage: Number.parseInt(formData.square_footage),
            package_id: formData.package_id || null,
            custom_components: formData.custom_components || {},
            total_cost: formData.total_cost || 0,
            status: "new",
            project_type: formData.project_type || "General",
            message: formData.message || "",
          }),
        })

        if (response.ok) {
          const result = await response.json()
          setLeads([...leads, result.lead])
          setFormData({})
          setEditingItem(null)
          setShowModal(false)
          console.log("[v0] Lead created successfully:", result.lead.id)
        } else {
          const errorText = await response.text()
          console.log("[v0] Lead creation failed:", response.status, errorText)
          throw new Error(`Failed to create lead: ${response.status}`)
        }
      } catch (error) {
        console.log("[v0] Lead creation error:", error)
        logError(error as Error, { context: "Creating lead", formData })
      }
    } else {
      console.log("[v0] Missing required fields for lead creation")
    }
  }

  const handleCreateProject = async () => {
    const missingFields = []
    if (!formData.title) missingFields.push("title")
    if (!formData.customer_id) missingFields.push("customer_id")

    if (missingFields.length > 0) {
      const validationError = new Error(`Missing required fields: ${missingFields.join(", ")}`)
      console.log("[v0] Validation error:", validationError.message)
      logError(validationError, { context: "Project validation", formData })
      return
    }

    if (!isValidUUID(formData.customer_id)) {
      const validationError = new Error("Invalid customer ID format - must be a valid UUID")
      console.log("[v0] UUID validation error:", validationError.message)
      logError(validationError, { context: "Project validation", formData })
      return
    }

    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: generateUUID(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setProjects([...projects, result.project])
        setFormData({})
        setShowModal(false)
        console.log("[v0] Project created successfully:", result.project.id)
      } else {
        const errorText = await response.text()
        console.log("[v0] Project creation failed:", response.status, errorText)
        throw new Error(`Failed to create project: ${response.status}`)
      }
    } catch (error) {
      console.log("[v0] Project creation error:", error)
      logError(error as Error, { context: "Creating project", formData })
    }
  }

  const handleCreateCustomer = async () => {
    if (formData.name && formData.email && formData.phone) {
      try {
        const [firstName, ...lastNameParts] = formData.name.split(" ")
        const lastName = lastNameParts.join(" ")

        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address || "",
            role: "customer",
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const newCustomer = {
            id: result.user.id,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            email: result.user.email,
            phone: result.user.phone,
            address: result.user.address || "",
            total_projects: 0,
          }
          setCustomers([...customers, newCustomer])
          setFormData({})
          setEditingItem(null)
          setShowModal(false)
          console.log("[v0] Customer created successfully:", result.user.id)
        } else {
          throw new Error("Failed to create customer")
        }
      } catch (error) {
        logError(error as Error, { context: "Creating customer", formData })
      }
    }
  }

  const handleUpdateStatus = async (type: string, id: string, newStatus: string) => {
    try {
      if (type === "lead") {
        const response = await fetch(`/api/admin/leads/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (response.ok) {
          setLeads(leads.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead)))
        }
      } else if (type === "project") {
        const response = await fetch(`/api/admin/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (response.ok) {
          setProjects(projects.map((project) => (project.id === id ? { ...project, status: newStatus } : project)))
        }
      }

      console.log(`[v0] ${type} status updated successfully:`, { type, id, newStatus })
    } catch (error) {
      logError(error as Error, { context: "Updating status", type, id, newStatus })
    }
  }

  const handleDeleteLead = async (id: string) => {
    try {
      console.log("[v0] Deleting lead with ID:", id, "Type:", typeof id)

      if (!id || typeof id !== "string" || id.length < 36) {
        throw new Error("Invalid lead ID format")
      }

      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLeads(leads.filter((lead) => lead.id !== id))
        console.log("[v0] Lead deleted successfully")
      } else {
        throw new Error(`Failed to delete lead: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      logError(error as Error, { context: "Deleting lead", id })
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      console.log("[v0] Deleting project with ID:", id, "Type:", typeof id)

      if (!id || typeof id !== "string" || id.length < 36) {
        throw new Error("Invalid project ID format")
      }

      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProjects(projects.filter((project) => project.id !== id))
        console.log("[v0] Project deleted successfully")
      } else {
        throw new Error(`Failed to delete project: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      logError(error as Error, { context: "Deleting project", id })
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      console.log("[v0] Deleting customer with ID:", id, "Type:", typeof id)

      if (!id || typeof id !== "string" || id.length < 36) {
        throw new Error("Invalid customer ID format")
      }

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCustomers(customers.filter((customer) => customer.id !== id))
        console.log("[v0] Customer deleted successfully")
      } else {
        throw new Error(`Failed to delete customer: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      logError(error as Error, { context: "Deleting customer", id })
    }
  }

  const handleEdit = (type: string, item: any) => {
    setModalType(type)
    setEditingItem(item)

    if (type === "lead") {
      setFormData({
        name: item.name,
        email: item.email,
        phone: item.phone,
        project_type: item.project_type,
        message: item.message,
        project_address: item.project_address || "",
        square_footage: item.square_footage || "",
      })
    } else if (type === "project") {
      setFormData({
        title: item.title,
        customer_id: item.customer_id,
        square_footage: item.square_footage || "",
        project_address: item.project_address || "",
        start_date: item.start_date,
        estimated_completion: item.estimated_completion,
      })
    } else if (type === "customer") {
      setFormData({
        name: `${item.first_name} ${item.last_name}`,
        email: item.email,
        phone: item.phone,
        address: item.address || "",
      })
    }

    setShowModal(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return

    try {
      let response
      let updatedItem

      if (modalType === "lead") {
        response = await fetch(`/api/admin/leads/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: formData.phone,
            project_address: formData.project_address || "",
            square_footage: Number.parseInt(formData.square_footage) || null,
            project_type: formData.project_type || "General",
            message: formData.message || "",
          }),
        })

        if (response.ok) {
          const result = await response.json()
          setLeads(leads.map((lead) => (lead.id === editingItem.id ? result.lead : lead)))
          updatedItem = result.lead
        }
      } else if (modalType === "project") {
        response = await fetch(`/api/admin/projects/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            customer_id: formData.customer_id,
            square_footage: formData.square_footage ? Number.parseInt(formData.square_footage) : null,
            project_address: formData.project_address || null,
            start_date: formData.start_date,
            estimated_completion: formData.estimated_completion,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          setProjects(projects.map((project) => (project.id === editingItem.id ? result.project : project)))
          updatedItem = result.project
        }
      } else if (modalType === "customer") {
        const [firstName, ...lastNameParts] = formData.name.split(" ")
        const lastName = lastNameParts.join(" ")

        response = await fetch(`/api/admin/users/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address || "",
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const updatedCustomer = {
            id: result.user.id,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            email: result.user.email,
            phone: result.user.phone,
            address: result.user.address || "",
            total_projects: editingItem.total_projects,
          }
          setCustomers(customers.map((customer) => (customer.id === editingItem.id ? updatedCustomer : customer)))
          updatedItem = updatedCustomer
        }
      }

      if (response?.ok) {
        setFormData({})
        setEditingItem(null)
        setShowModal(false)
        console.log(`[v0] ${modalType} updated successfully:`, updatedItem?.id)
      } else {
        throw new Error(`Failed to update ${modalType}`)
      }
    } catch (error) {
      logError(error as Error, { context: `Updating ${modalType}`, formData, editingItem })
    }
  }

  const openModal = (type: string) => {
    setModalType(type)
    setFormData({})
    setEditingItem(null)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Site
            </button>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {["dashboard", "leads", "projects", "customers", "content"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "dashboard" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold mb-2 text-green-800">Total Leads</h3>
                      <p className="text-3xl font-bold text-green-600">{leads.length}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold mb-2 text-blue-800">Active Projects</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {projects.filter((p) => p.status === "in_progress").length}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <h3 className="text-lg font-semibold mb-2 text-orange-800">Total Customers</h3>
                      <p className="text-3xl font-bold text-orange-600">{customers.length}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <h3 className="text-lg font-semibold mb-2 text-purple-800">Revenue</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => openModal("lead")}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Add New Lead
                      </button>
                      <button
                        onClick={() => openModal("project")}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Create Project
                      </button>
                      <button
                        onClick={() => openModal("customer")}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        Add Customer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "leads" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Leads Management</h2>
                    <button
                      onClick={() => openModal("lead")}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Add New Lead
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Project Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leads.map((lead) => (
                          <tr key={lead.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{lead.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>{lead.email}</div>
                              <div className="text-sm text-gray-500">{lead.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{lead.project_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateStatus("lead", lead.id, e.target.value)}
                                className="border rounded px-2 py-1"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="quoted">Quoted</option>
                                <option value="converted">Converted</option>
                                <option value="closed">Closed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleEdit("lead", lead)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "projects" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Projects Management</h2>
                    <button
                      onClick={() => openModal("project")}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Create New Project
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Project Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {projects.map((project) => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{project.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{project.customer_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{project.progress_percentage || 0}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={project.status}
                                onChange={(e) => handleUpdateStatus("project", project.id, e.target.value)}
                                className="border rounded px-2 py-1"
                              >
                                <option value="planning">Planning</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleEdit("project", project)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "customers" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Customer Management</h2>
                    <button
                      onClick={() => openModal("customer")}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Add New Customer
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {customer.first_name} {customer.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>{customer.email}</div>
                              <div className="text-sm text-gray-500">{customer.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{customer.total_projects}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleEdit("customer", customer)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Content Management</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Website Content</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => router.push("/admin/content")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          Edit Homepage Content
                        </button>
                        <button
                          onClick={() => router.push("/admin/services")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          Manage Services
                        </button>
                        <button
                          onClick={() => router.push("/admin/gallery")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          Photo Gallery
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">SEO & Analytics</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => router.push("/admin/seo")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          SEO Settings
                        </button>
                        <button
                          onClick={() => router.push("/admin/analytics")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          Analytics Dashboard
                        </button>
                        <button
                          onClick={() => router.push("/admin/error-logs")}
                          className="w-full text-left bg-white hover:bg-gray-100 px-4 py-3 rounded border"
                        >
                          Error Logs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  {editingItem ? "Edit" : "Create New"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </h3>

                {modalType === "lead" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Project Address"
                      value={formData.project_address || ""}
                      onChange={(e) => setFormData({ ...formData, project_address: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Square Footage *"
                      value={formData.square_footage || ""}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                    <select
                      value={formData.project_type || ""}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Project Type</option>
                      <option value="Garage Floor">Garage Floor</option>
                      <option value="Basement">Basement</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                    <textarea
                      placeholder="Message"
                      value={formData.message || ""}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full border rounded px-3 py-2 h-20"
                    />
                  </div>
                )}

                {modalType === "project" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Customer ID"
                      value={formData.customer_id || ""}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Square Footage"
                      value={formData.square_footage || ""}
                      onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Project Address"
                      value={formData.project_address || ""}
                      onChange={(e) => setFormData({ ...formData, project_address: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}

                {modalType === "customer" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                    <textarea
                      placeholder="Address"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border rounded px-3 py-2 h-20"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingItem) {
                        handleUpdate()
                      } else {
                        if (modalType === "lead") handleCreateLead()
                        else if (modalType === "project") handleCreateProject()
                        else if (modalType === "customer") handleCreateCustomer()
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {editingItem ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
