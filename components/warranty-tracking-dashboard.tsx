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
  Shield,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Camera,
  Mail,
  Phone,
  Edit,
  Eye,
  Download,
} from "lucide-react"

interface Warranty {
  id: string
  customer_id: string
  customer_name: string
  project_id: string
  project_title: string
  warranty_type: string
  coverage_years: number
  start_date: string
  end_date: string
  is_active: boolean
  terms_and_conditions: string
  created_at: string
}

interface WarrantyClaim {
  id: string
  warranty_id: string
  customer_id: string
  customer_name: string
  claim_number: string
  issue_description: string
  status: "submitted" | "under_review" | "approved" | "rejected" | "resolved"
  claim_photos: string[]
  resolution_notes?: string
  created_at: string
  resolved_at?: string
}

interface WarrantyAlert {
  id: string
  warranty_id: string
  customer_name: string
  project_title: string
  alert_type: "expiring_soon" | "expired" | "claim_pending"
  expiry_date: string
  priority: "high" | "medium" | "low"
}

function WarrantyTrackingDashboard() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([])
  const [warrantyAlerts, setWarrantyAlerts] = useState<WarrantyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null)

  const [warrantyForm, setWarrantyForm] = useState({
    customer_id: "",
    project_id: "",
    warranty_type: "",
    coverage_years: 5,
    start_date: "",
    terms_and_conditions: "",
  })

  const [claimForm, setClaimForm] = useState({
    issue_description: "",
    photos: [] as File[],
  })

  const [claimResolution, setClaimResolution] = useState({
    status: "",
    resolution_notes: "",
  })

  useEffect(() => {
    loadWarrantyData()
  }, [])

  const loadWarrantyData = async () => {
    try {
      setLoading(true)

      // Load warranties
      const warrantiesResponse = await fetch("/api/admin/warranties")
      if (warrantiesResponse.ok) {
        const warrantiesData = await warrantiesResponse.json()
        setWarranties(warrantiesData)
      }

      // Load warranty claims
      const claimsResponse = await fetch("/api/admin/warranties/claims")
      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json()
        setWarrantyClaims(claimsData)
      }

      // Load warranty alerts
      const alertsResponse = await fetch("/api/admin/warranties/alerts")
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setWarrantyAlerts(alertsData)
      }
    } catch (error) {
      console.error("Error loading warranty data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWarranty = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warrantyForm),
      })

      if (response.ok) {
        await loadWarrantyData()
        setShowAddDialog(false)
        setWarrantyForm({
          customer_id: "",
          project_id: "",
          warranty_type: "",
          coverage_years: 5,
          start_date: "",
          terms_and_conditions: "",
        })
        alert("Warranty added successfully!")
      }
    } catch (error) {
      console.error("Error adding warranty:", error)
      alert("Error adding warranty")
    }
  }

  const handleClaimResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClaim) return

    try {
      const response = await fetch(`/api/admin/warranties/claims/${selectedClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimResolution),
      })

      if (response.ok) {
        await loadWarrantyData()
        setShowClaimDialog(false)
        setClaimResolution({ status: "", resolution_notes: "" })
        setSelectedClaim(null)
        alert("Claim updated successfully!")
      }
    } catch (error) {
      console.error("Error updating claim:", error)
      alert("Error updating claim")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "approved":
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case "under_review":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "submitted":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "rejected":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateWarrantyStatus = (warranty: Warranty) => {
    const endDate = new Date(warranty.end_date)
    const currentDate = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { status: "expired", color: "bg-red-100 text-red-800" }
    if (daysUntilExpiry <= 30) return { status: "expiring soon", color: "bg-yellow-100 text-yellow-800" }
    return { status: "active", color: "bg-green-100 text-green-800" }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading warranty data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Warranty Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                <p className="text-2xl font-bold">{warranties.filter((w) => w.is_active).length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                <p className="text-2xl font-bold">
                  {warrantyClaims.filter((c) => ["submitted", "under_review"].includes(c.status)).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {
                    warranties.filter((w) => {
                      const daysUntilExpiry = Math.ceil(
                        (new Date(w.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )
                      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
                    }).length
                  }
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Claims</p>
                <p className="text-2xl font-bold">{warrantyClaims.filter((c) => c.status === "resolved").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Warranty Management Tabs */}
      <Tabs defaultValue="warranties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="warranties">Warranties</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Warranties Tab */}
        <TabsContent value="warranties" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Warranty Management</CardTitle>
                  <CardDescription>Track and manage customer warranties</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Warranty
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Warranty</DialogTitle>
                      <DialogDescription>Create warranty coverage for completed project</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddWarranty} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customer_id">Customer</Label>
                          <Select
                            value={warrantyForm.customer_id}
                            onValueChange={(value) => setWarrantyForm({ ...warrantyForm, customer_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cust1">John Smith</SelectItem>
                              <SelectItem value="cust2">Jane Doe</SelectItem>
                              <SelectItem value="cust3">Bob Johnson</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="project_id">Project</Label>
                          <Select
                            value={warrantyForm.project_id}
                            onValueChange={(value) => setWarrantyForm({ ...warrantyForm, project_id: value })}
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
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="warranty_type">Warranty Type</Label>
                          <Select
                            value={warrantyForm.warranty_type}
                            onValueChange={(value) => setWarrantyForm({ ...warrantyForm, warranty_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Material">Material Warranty</SelectItem>
                              <SelectItem value="Workmanship">Workmanship Warranty</SelectItem>
                              <SelectItem value="Full Coverage">Full Coverage</SelectItem>
                              <SelectItem value="Limited">Limited Warranty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="coverage_years">Coverage Years</Label>
                          <Input
                            id="coverage_years"
                            type="number"
                            value={warrantyForm.coverage_years}
                            onChange={(e) =>
                              setWarrantyForm({ ...warrantyForm, coverage_years: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={warrantyForm.start_date}
                          onChange={(e) => setWarrantyForm({ ...warrantyForm, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                        <Textarea
                          id="terms_and_conditions"
                          value={warrantyForm.terms_and_conditions}
                          onChange={(e) => setWarrantyForm({ ...warrantyForm, terms_and_conditions: e.target.value })}
                          rows={4}
                          placeholder="Enter warranty terms and conditions..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Warranty</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warranties.map((warranty) => {
                    const warrantyStatus = calculateWarrantyStatus(warranty)
                    return (
                      <TableRow key={warranty.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{warranty.customer_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{warranty.project_title}</TableCell>
                        <TableCell>{warranty.warranty_type}</TableCell>
                        <TableCell>{warranty.coverage_years} years</TableCell>
                        <TableCell>
                          <Badge className={warrantyStatus.color}>{warrantyStatus.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(warranty.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
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

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warranty Claims</CardTitle>
              <CardDescription>Process and manage warranty claims</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantyClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>{claim.customer_name}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{claim.issue_description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(claim.status)}>
                          {getStatusIcon(claim.status)}
                          {claim.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(claim.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClaim(claim)
                              setShowClaimDialog(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {claim.claim_photos.length > 0 && (
                            <Button size="sm" variant="outline">
                              <Camera className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warranty Alerts</CardTitle>
              <CardDescription>Important warranty notifications and reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warrantyAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{alert.customer_name}</p>
                        <p className="text-sm text-gray-600">{alert.project_title}</p>
                        <p className="text-xs text-gray-500">
                          {alert.alert_type.replace("_", " ")} - {new Date(alert.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Warranty Statistics</CardTitle>
                <CardDescription>Overview of warranty performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Warranties Issued</span>
                  <span className="font-medium">{warranties.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Warranties</span>
                  <span className="font-medium">{warranties.filter((w) => w.is_active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Claims Submitted</span>
                  <span className="font-medium">{warrantyClaims.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Claims Resolved</span>
                  <span className="font-medium">{warrantyClaims.filter((c) => c.status === "resolved").length}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Resolution Rate</span>
                  <span>
                    {warrantyClaims.length > 0
                      ? Math.round(
                          (warrantyClaims.filter((c) => c.status === "resolved").length / warrantyClaims.length) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warranty Types</CardTitle>
                <CardDescription>Distribution of warranty coverage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Material", "Workmanship", "Full Coverage", "Limited"].map((type) => {
                  const count = warranties.filter((w) => w.warranty_type === type).length
                  const percentage = warranties.length > 0 ? (count / warranties.length) * 100 : 0
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{type}</span>
                        <span>
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Claim Details Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Warranty Claim Details</DialogTitle>
            <DialogDescription>
              Claim #{selectedClaim?.claim_number} - {selectedClaim?.customer_name}
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Description</Label>
                  <Textarea value={selectedClaim.issue_description} readOnly rows={3} />
                </div>
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-2">
                    <Badge className={getStatusColor(selectedClaim.status)}>
                      {getStatusIcon(selectedClaim.status)}
                      {selectedClaim.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedClaim.claim_photos.length > 0 && (
                <div>
                  <Label>Claim Photos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedClaim.claim_photos.slice(0, 3).map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                      >
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleClaimResolution} className="space-y-4">
                <div>
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={claimResolution.status}
                    onValueChange={(value) => setClaimResolution({ ...claimResolution, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resolution_notes">Resolution Notes</Label>
                  <Textarea
                    id="resolution_notes"
                    value={claimResolution.resolution_notes}
                    onChange={(e) => setClaimResolution({ ...claimResolution, resolution_notes: e.target.value })}
                    rows={3}
                    placeholder="Enter resolution details..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowClaimDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Claim</Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { WarrantyTrackingDashboard }
export default WarrantyTrackingDashboard
