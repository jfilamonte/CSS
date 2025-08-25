"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Edit,
  Plus,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ImageIcon,
  AlertCircle,
  Eye,
} from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  role: string
  is_active: boolean
  created_at: string
}

interface Quote {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  project_address: string
  square_footage: number
  status: string
  total_cost: number
  created_at: string
  quote_data: any
  user_id?: string
}

interface Project {
  id: string
  title: string
  description: string
  customer_id: string
  status: string
  progress_percentage: number
  square_footage: number
  project_address: string
  start_date: string
  estimated_completion: string
  created_at: string
}

export default function AdminPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userQuotes, setUserQuotes] = useState<Quote[]>([])

  // Modal states
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)

  // Edit states
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/auth/login")
          return
        }

        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError || userData?.role !== "admin") {
          console.log("[v0] User is not admin, redirecting")
          router.push("/")
          return
        }

        setUser(user)
        await loadAllData()
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadAllData = async () => {
    try {
      // Load quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })

      if (quotesError) throw quotesError
      setQuotes(quotesData || [])

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (projectsError) throw projectsError
      setProjects(projectsData || [])

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])

      console.log("[v0] All data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    }
  }

  const loadUserQuotes = async (userId: string) => {
    try {
      const { data: userQuotesData, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setUserQuotes(userQuotesData || [])
    } catch (error) {
      console.error("[v0] Error loading user quotes:", error)
      setUserQuotes([])
    }
  }

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user)
    await loadUserQuotes(user.id)
    setIsUserDetailModalOpen(true)
  }

  const handleCreateQuote = async (formData: FormData) => {
    try {
      const quoteData = {
        id: generateUUID(),
        customer_name: formData.get("customer_name") as string,
        customer_email: formData.get("customer_email") as string,
        customer_phone: formData.get("customer_phone") as string,
        project_address: formData.get("project_address") as string,
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        status: "pending", // Use valid status from database constraint
        total_cost: Number.parseFloat(formData.get("total_cost") as string) || 0,
        quote_data: {
          notes: (formData.get("notes") as string) || "",
          created_by: user?.id,
        },
      }

      const { error } = await supabase.from("quotes").insert(quoteData)

      if (error) throw error

      console.log("[v0] Quote created successfully")
      setIsQuoteModalOpen(false)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error creating quote:", error)
      alert("Failed to create quote: " + (error as Error).message)
    }
  }

  const handleUpdateQuote = async (formData: FormData) => {
    if (!editingQuote) return

    try {
      const updateData = {
        customer_name: formData.get("customer_name") as string,
        customer_email: formData.get("customer_email") as string,
        customer_phone: formData.get("customer_phone") as string,
        project_address: formData.get("project_address") as string,
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        status: formData.get("status") as string,
        total_cost: Number.parseFloat(formData.get("total_cost") as string) || 0,
        quote_data: {
          ...editingQuote.quote_data,
          notes: (formData.get("notes") as string) || "",
          updated_by: user?.id,
        },
      }

      const { error } = await supabase.from("quotes").update(updateData).eq("id", editingQuote.id)

      if (error) throw error

      console.log("[v0] Quote updated successfully")
      setIsQuoteModalOpen(false)
      setEditingQuote(null)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error updating quote:", error)
      alert("Failed to update quote: " + (error as Error).message)
    }
  }

  const handleCreateProject = async (formData: FormData) => {
    try {
      const projectData = {
        id: generateUUID(),
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        customer_id: formData.get("customer_id") as string,
        status: "planning",
        progress_percentage: 0,
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        project_address: formData.get("project_address") as string,
        start_date: formData.get("start_date") as string,
        estimated_completion: formData.get("estimated_completion") as string,
      }

      const { error } = await supabase.from("projects").insert(projectData)

      if (error) throw error

      console.log("[v0] Project created successfully")
      setIsProjectModalOpen(false)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error creating project:", error)
      alert("Failed to create project: " + (error as Error).message)
    }
  }

  const handleUpdateProject = async (formData: FormData) => {
    if (!editingProject) return

    try {
      const updateData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        customer_id: formData.get("customer_id") as string,
        status: formData.get("status") as string,
        progress_percentage: Number.parseInt(formData.get("progress_percentage") as string),
        square_footage: Number.parseInt(formData.get("square_footage") as string),
        project_address: formData.get("project_address") as string,
        start_date: formData.get("start_date") as string,
        estimated_completion: formData.get("estimated_completion") as string,
      }

      const { error } = await supabase.from("projects").update(updateData).eq("id", editingProject.id)

      if (error) throw error

      console.log("[v0] Project updated successfully")
      setIsProjectModalOpen(false)
      setEditingProject(null)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error updating project:", error)
      alert("Failed to update project: " + (error as Error).message)
    }
  }

  const handleCreateUser = async (formData: FormData) => {
    try {
      const userData = {
        id: generateUUID(),
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip_code: formData.get("zip_code") as string,
        role: formData.get("role") as string,
        is_active: true,
      }

      const { error } = await supabase.from("users").insert(userData)

      if (error) throw error

      console.log("[v0] User created successfully")
      setIsUserModalOpen(false)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error creating user:", error)
      alert("Failed to create user: " + (error as Error).message)
    }
  }

  const handleUpdateUser = async (formData: FormData) => {
    if (!editingUser) return

    try {
      const updateData = {
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        zip_code: formData.get("zip_code") as string,
        role: formData.get("role") as string,
        is_active: formData.get("is_active") === "true",
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", editingUser.id)

      if (error) throw error

      console.log("[v0] User updated successfully")
      setIsUserModalOpen(false)
      setEditingUser(null)
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      alert("Failed to update user: " + (error as Error).message)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return

    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id)

      if (error) throw error

      console.log("[v0] Quote deleted successfully")
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error deleting quote:", error)
      alert("Failed to delete quote: " + (error as Error).message)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error

      console.log("[v0] Project deleted successfully")
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error deleting project:", error)
      alert("Failed to delete project: " + (error as Error).message)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      console.log("[v0] User deleted successfully")
      await loadAllData()
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      alert("Failed to delete user: " + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin portal...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.email}</span>
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/auth/login")
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="border-t">
            <nav className="flex space-x-8 py-4">
              <Button variant="ghost" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Button variant="ghost" className="flex items-center space-x-2" onClick={() => router.push("/admin/cms")}>
                <FileText className="h-4 w-4" />
                <span>CMS</span>
              </Button>
              <Button variant="ghost" className="flex items-center space-x-2" onClick={() => router.push("/admin/seo")}>
                <Settings className="h-4 w-4" />
                <span>SEO Settings</span>
              </Button>
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => router.push("/admin/gallery")}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Gallery</span>
              </Button>
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => router.push("/admin/error-logs")}
              >
                <AlertCircle className="h-4 w-4" />
                <span>Error Logs</span>
              </Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Quotes</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{quotes.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Projects</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{projects.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                ${quotes.reduce((sum, q) => sum + (q.total_cost || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="quotes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="quotes" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
              Quotes
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900"
            >
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900"
            >
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Quotes Management</h2>
              <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingQuote(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingQuote ? "Edit Quote" : "Create New Quote"}</DialogTitle>
                    <DialogDescription>
                      {editingQuote ? "Update quote information" : "Add a new quote to the system"}
                    </DialogDescription>
                  </DialogHeader>
                  <form action={editingQuote ? handleUpdateQuote : handleCreateQuote} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          name="customer_name"
                          defaultValue={editingQuote?.customer_name || ""}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_email">Customer Email</Label>
                        <Input
                          id="customer_email"
                          name="customer_email"
                          type="email"
                          defaultValue={editingQuote?.customer_email || ""}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_phone">Customer Phone</Label>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          defaultValue={editingQuote?.customer_phone || ""}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="square_footage">Square Footage</Label>
                        <Input
                          id="square_footage"
                          name="square_footage"
                          type="number"
                          defaultValue={editingQuote?.square_footage || ""}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="project_address">Project Address</Label>
                      <Input
                        id="project_address"
                        name="project_address"
                        defaultValue={editingQuote?.project_address || ""}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="total_cost">Total Cost</Label>
                        <Input
                          id="total_cost"
                          name="total_cost"
                          type="number"
                          step="0.01"
                          defaultValue={editingQuote?.total_cost || ""}
                        />
                      </div>
                      {editingQuote && (
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select name="status" defaultValue={editingQuote.status}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" defaultValue={editingQuote?.quote_data?.notes || ""} rows={3} />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsQuoteModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingQuote ? "Update Quote" : "Create Quote"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Square Footage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotes.map((quote) => (
                        <tr key={quote.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{quote.customer_name}</div>
                              <div className="text-sm text-gray-500">{quote.customer_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.project_address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quote.square_footage?.toLocaleString() || "N/A"} sq ft
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(quote.total_cost || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={quote.status === "approved" ? "default" : "secondary"}>
                              {quote.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingQuote(quote)
                                setIsQuoteModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteQuote(quote.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card className="shadow-sm border-2">
              <CardHeader className="bg-green-50 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-900">Projects Management</CardTitle>
                  <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                      <DialogHeader className="bg-green-50 -m-6 p-6 mb-6">
                        <DialogTitle className="text-green-900">
                          {editingProject ? "Edit Project" : "Create New Project"}
                        </DialogTitle>
                        <DialogDescription className="text-green-700">
                          {editingProject ? "Update project information" : "Add a new project to the system"}
                        </DialogDescription>
                      </DialogHeader>
                      <form action={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title" className="text-sm font-medium text-gray-900">
                              Project Title *
                            </Label>
                            <Input
                              id="title"
                              name="title"
                              defaultValue={editingProject?.title || ""}
                              required
                              className="mt-1 border-2 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="customer_id" className="text-sm font-medium text-gray-900">
                              Customer *
                            </Label>
                            <Select name="customer_id" defaultValue={editingProject?.customer_id || ""}>
                              <SelectTrigger className="mt-1 border-2 focus:border-green-500">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2">
                                {users.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.first_name} {customer.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={editingProject?.description || ""}
                            rows={3}
                            className="mt-1 border-2 focus:border-green-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="square_footage" className="text-sm font-medium text-gray-900">
                              Square Footage *
                            </Label>
                            <Input
                              id="square_footage"
                              name="square_footage"
                              type="number"
                              defaultValue={editingProject?.square_footage || ""}
                              required
                              className="mt-1 border-2 focus:border-green-500"
                            />
                          </div>
                          {editingProject && (
                            <div>
                              <Label htmlFor="progress_percentage" className="text-sm font-medium text-gray-900">
                                Progress %
                              </Label>
                              <Input
                                id="progress_percentage"
                                name="progress_percentage"
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={editingProject?.progress_percentage || ""}
                                className="mt-1 border-2 focus:border-green-500"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="project_address" className="text-sm font-medium text-gray-900">
                            Project Address *
                          </Label>
                          <Input
                            id="project_address"
                            name="project_address"
                            defaultValue={editingProject?.project_address || ""}
                            required
                            className="mt-1 border-2 focus:border-green-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_date" className="text-sm font-medium text-gray-900">
                              Start Date
                            </Label>
                            <Input
                              id="start_date"
                              name="start_date"
                              type="date"
                              defaultValue={editingProject?.start_date || ""}
                              className="mt-1 border-2 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor="estimated_completion" className="text-sm font-medium text-gray-900">
                              Estimated Completion
                            </Label>
                            <Input
                              id="estimated_completion"
                              name="estimated_completion"
                              type="date"
                              defaultValue={editingProject?.estimated_completion || ""}
                              className="mt-1 border-2 focus:border-green-500"
                            />
                          </div>
                        </div>
                        {editingProject && (
                          <div>
                            <Label htmlFor="status" className="text-sm font-medium text-gray-900">
                              Status
                            </Label>
                            <Select name="status" defaultValue={editingProject.status}>
                              <SelectTrigger className="mt-1 border-2 focus:border-green-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2">
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsProjectModalOpen(false)
                              setEditingProject(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            {editingProject ? "Update Project" : "Create Project"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{project.title}</div>
                              <div className="text-sm text-gray-500">
                                {project.square_footage?.toLocaleString() || "N/A"} sq ft
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.project_address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.progress_percentage || 0}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingProject(project)
                                setIsProjectModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteProject(project.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">User Management</h2>
              <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingUser(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Update user information and settings" : "Add a new user to the system"}
                    </DialogDescription>
                  </DialogHeader>
                  <form action={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          defaultValue={editingUser?.first_name || ""}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" defaultValue={editingUser?.last_name || ""} required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingUser?.email || ""} required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" defaultValue={editingUser?.phone || ""} />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue={editingUser?.role || "customer"}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editingUser && (
                        <div>
                          <Label htmlFor="is_active">Status</Label>
                          <Select name="is_active" defaultValue={editingUser.is_active ? "true" : "false"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" name="address" defaultValue={editingUser?.address || ""} />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" defaultValue={editingUser?.city || ""} />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" defaultValue={editingUser?.state || ""} />
                      </div>
                      <div>
                        <Label htmlFor="zip_code">Zip Code</Label>
                        <Input id="zip_code" name="zip_code" defaultValue={editingUser?.zip_code || ""} />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingUser ? "Update User" : "Create User"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quotes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.phone}</div>
                            <div className="text-sm text-gray-500">
                              {user.city}, {user.state}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                user.role === "admin" ? "default" : user.role === "staff" ? "secondary" : "outline"
                              }
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.is_active ? "default" : "destructive"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {quotes.filter((q) => q.user_id === user.id).length} quotes
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewUserDetails(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setIsUserModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isUserDetailModalOpen} onOpenChange={setIsUserDetailModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                User Details: {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogTitle>
              <DialogDescription>Complete user information and quote history</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Email:</strong> {selectedUser.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedUser.phone}
                      </div>
                      <div>
                        <strong>Address:</strong> {selectedUser.address}
                      </div>
                      <div>
                        <strong>City:</strong> {selectedUser.city}, {selectedUser.state} {selectedUser.zip_code}
                      </div>
                      <div>
                        <strong>Role:</strong> <Badge>{selectedUser.role}</Badge>
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant={selectedUser.is_active ? "default" : "destructive"}>
                          {selectedUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quote Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Total Quotes:</strong> {userQuotes.length}
                      </div>
                      <div>
                        <strong>Total Value:</strong> $
                        {userQuotes.reduce((sum, q) => sum + (q.total_cost || 0), 0).toLocaleString()}
                      </div>
                      <div>
                        <strong>Pending:</strong> {userQuotes.filter((q) => q.status === "pending").length}
                      </div>
                      <div>
                        <strong>Approved:</strong> {userQuotes.filter((q) => q.status === "approved").length}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quote History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {userQuotes.map((quote) => (
                            <tr key={quote.id}>
                              <td className="px-4 py-2 text-sm">{quote.project_address}</td>
                              <td className="px-4 py-2">
                                <Badge variant={quote.status === "approved" ? "default" : "secondary"}>
                                  {quote.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">${quote.total_cost?.toLocaleString()}</td>
                              <td className="px-4 py-2 text-sm">{new Date(quote.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
