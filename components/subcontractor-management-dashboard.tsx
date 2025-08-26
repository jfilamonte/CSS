"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Plus,
  Star,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Edit,
  Eye,
} from "lucide-react"

interface Subcontractor {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  specialties: string[]
  hourly_rate: number
  rating: number
  is_active: boolean
  insurance_expiry: string
  created_at: string
  projects_completed: number
  total_earnings: number
}

interface SubcontractorProject {
  id: string
  subcontractor_id: string
  project_id: string
  project_title: string
  start_date: string
  end_date: string
  status: "assigned" | "in_progress" | "completed" | "cancelled"
  payment_amount: number
  payment_status: "pending" | "paid" | "overdue"
  rating?: number
  feedback?: string
}

interface PerformanceMetric {
  subcontractor_id: string
  on_time_completion: number
  quality_rating: number
  communication_rating: number
  projects_this_month: number
  earnings_this_month: number
}

function SubcontractorManagementDashboard() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [subcontractorProjects, setSubcontractorProjects] = useState<SubcontractorProject[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null)

  const [subcontractorForm, setSubcontractorForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    specialties: "",
    hourly_rate: 0,
    insurance_expiry: "",
  })

  const [assignmentForm, setAssignmentForm] = useState({
    project_id: "",
    start_date: "",
    end_date: "",
    payment_amount: 0,
    notes: "",
  })

  useEffect(() => {
    loadSubcontractorData()
  }, [])

  const loadSubcontractorData = async () => {
    try {
      setLoading(true)

      // Load subcontractors
      const subcontractorsResponse = await fetch("/api/admin/subcontractors")
      if (subcontractorsResponse.ok) {
        const subcontractorsData = await subcontractorsResponse.json()
        setSubcontractors(subcontractorsData)
      }

      // Load subcontractor projects
      const projectsResponse = await fetch("/api/admin/subcontractors/projects")
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setSubcontractorProjects(projectsData)
      }

      // Load performance metrics
      const metricsResponse = await fetch("/api/admin/subcontractors/performance")
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setPerformanceMetrics(metricsData)
      }
    } catch (error) {
      console.error("Error loading subcontractor data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subcontractorForm,
          specialties: subcontractorForm.specialties.split(",").map((s) => s.trim()),
        }),
      })

      if (response.ok) {
        await loadSubcontractorData()
        setShowAddDialog(false)
        setSubcontractorForm({
          company_name: "",
          contact_name: "",
          email: "",
          phone: "",
          address: "",
          specialties: "",
          hourly_rate: 0,
          insurance_expiry: "",
        })
        alert("Subcontractor added successfully!")
      }
    } catch (error) {
      console.error("Error adding subcontractor:", error)
      alert("Error adding subcontractor")
    }
  }

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubcontractor) return

    try {
      const response = await fetch("/api/admin/subcontractors/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentForm,
          subcontractor_id: selectedSubcontractor.id,
        }),
      })

      if (response.ok) {
        await loadSubcontractorData()
        setShowAssignDialog(false)
        setAssignmentForm({
          project_id: "",
          start_date: "",
          end_date: "",
          payment_amount: 0,
          notes: "",
        })
        setSelectedSubcontractor(null)
        alert("Project assigned successfully!")
      }
    } catch (error) {
      console.error("Error assigning project:", error)
      alert("Error assigning project")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "assigned":
        return <Calendar className="w-4 h-4 text-yellow-500" />
      case "cancelled":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "assigned":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading subcontractor data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Subcontractor Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subcontractors</p>
                <p className="text-2xl font-bold">{subcontractors.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subcontractors</p>
                <p className="text-2xl font-bold">{subcontractors.filter((s) => s.is_active).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold">
                  {subcontractorProjects.filter((p) => p.status === "in_progress").length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
                <p className="text-2xl font-bold">
                  ${performanceMetrics.reduce((sum, m) => sum + m.earnings_this_month, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Subcontractor Management Tabs */}
      <Tabs defaultValue="subcontractors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Subcontractors Tab */}
        <TabsContent value="subcontractors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Subcontractor Directory</CardTitle>
                  <CardDescription>Manage your network of subcontractors</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subcontractor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Subcontractor</DialogTitle>
                      <DialogDescription>Enter subcontractor details and specialties</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubcontractor} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={subcontractorForm.company_name}
                            onChange={(e) =>
                              setSubcontractorForm({ ...subcontractorForm, company_name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_name">Contact Name</Label>
                          <Input
                            id="contact_name"
                            value={subcontractorForm.contact_name}
                            onChange={(e) =>
                              setSubcontractorForm({ ...subcontractorForm, contact_name: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={subcontractorForm.email}
                            onChange={(e) => setSubcontractorForm({ ...subcontractorForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={subcontractorForm.phone}
                            onChange={(e) => setSubcontractorForm({ ...subcontractorForm, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={subcontractorForm.address}
                          onChange={(e) => setSubcontractorForm({ ...subcontractorForm, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="specialties">Specialties (comma separated)</Label>
                          <Input
                            id="specialties"
                            value={subcontractorForm.specialties}
                            onChange={(e) =>
                              setSubcontractorForm({ ...subcontractorForm, specialties: e.target.value })
                            }
                            placeholder="Epoxy, Concrete Prep, Polishing"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hourly_rate">Hourly Rate</Label>
                          <Input
                            id="hourly_rate"
                            type="number"
                            value={subcontractorForm.hourly_rate}
                            onChange={(e) =>
                              setSubcontractorForm({ ...subcontractorForm, hourly_rate: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
                        <Input
                          id="insurance_expiry"
                          type="date"
                          value={subcontractorForm.insurance_expiry}
                          onChange={(e) =>
                            setSubcontractorForm({ ...subcontractorForm, insurance_expiry: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Subcontractor</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcontractors.map((subcontractor) => (
                  <Card key={subcontractor.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{subcontractor.company_name}</h3>
                          <p className="text-sm text-gray-600">{subcontractor.contact_name}</p>
                        </div>
                        <Badge variant={subcontractor.is_active ? "default" : "secondary"}>
                          {subcontractor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-1">
                        {renderStars(subcontractor.rating)}
                        <span className="text-sm text-gray-600 ml-2">({subcontractor.rating}/5)</span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {subcontractor.email}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {subcontractor.phone}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />${subcontractor.hourly_rate}/hr
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {subcontractor.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubcontractor(subcontractor)
                            setShowAssignDialog(true)
                          }}
                        >
                          Assign Project
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subcontractor Projects</CardTitle>
              <CardDescription>Track project assignments and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcontractorProjects.map((project) => {
                    const subcontractor = subcontractors.find((s) => s.id === project.subcontractor_id)
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subcontractor?.company_name}</p>
                            <p className="text-sm text-gray-600">{subcontractor?.contact_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{project.project_title}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusIcon(project.status)}
                            {project.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(project.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${project.payment_amount.toLocaleString()}</p>
                            <Badge
                              variant={project.payment_status === "paid" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {project.payment_status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest rated subcontractors this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subcontractors
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 5)
                  .map((subcontractor) => (
                    <div key={subcontractor.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{subcontractor.company_name}</p>
                        <div className="flex items-center space-x-1">{renderStars(subcontractor.rating)}</div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{subcontractor.projects_completed} projects</p>
                        <p className="text-sm text-gray-600">${subcontractor.total_earnings.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average On-Time Completion</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Quality Rating</span>
                    <span>4.3/5</span>
                  </div>
                  <Progress value={86} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Communication Rating</span>
                    <span>4.1/5</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Active Projects</span>
                  <span className="font-medium">
                    {subcontractorProjects.filter((p) => p.status === "in_progress").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completed This Month</span>
                  <span className="font-medium">
                    {subcontractorProjects.filter((p) => p.status === "completed").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Track subcontractor payments and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcontractorProjects
                    .filter((p) => p.payment_status !== "paid")
                    .map((project) => {
                      const subcontractor = subcontractors.find((s) => s.id === project.subcontractor_id)
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{subcontractor?.company_name}</p>
                              <p className="text-sm text-gray-600">{subcontractor?.contact_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{project.project_title}</TableCell>
                          <TableCell>${project.payment_amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={project.payment_status === "overdue" ? "destructive" : "secondary"}>
                              {project.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : "TBD"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Pay Now
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Project</DialogTitle>
            <DialogDescription>Assign a project to {selectedSubcontractor?.company_name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignProject} className="space-y-4">
            <div>
              <Label htmlFor="project_id">Project</Label>
              <Select
                value={assignmentForm.project_id}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proj1">Residential Garage - 123 Main St</SelectItem>
                  <SelectItem value="proj2">Commercial Warehouse - 456 Oak Ave</SelectItem>
                  <SelectItem value="proj3">Basement Renovation - 789 Pine St</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={assignmentForm.start_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Expected End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={assignmentForm.end_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment_amount">Payment Amount</Label>
              <Input
                id="payment_amount"
                type="number"
                value={assignmentForm.payment_amount}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, payment_amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Assign Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { SubcontractorManagementDashboard }
export default SubcontractorManagementDashboard
