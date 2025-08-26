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
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, DollarSign, Edit } from "lucide-react"

interface Equipment {
  id: string
  name: string
  category: string
  model: string
  serial_number: string
  purchase_date: string
  purchase_cost: number
  current_value: number
  status: "active" | "maintenance" | "retired" | "repair"
  maintenance_schedule_months: number
  last_maintenance: string
  next_maintenance: string
  location: string
  assigned_to?: string
}

interface MaintenanceRecord {
  id: string
  equipment_id: string
  maintenance_type: string
  description: string
  cost: number
  performed_by: string
  date: string
  next_due: string
  parts_replaced: string[]
}

interface MaintenanceAlert {
  id: string
  equipment_id: string
  equipment_name: string
  alert_type: "overdue" | "due_soon" | "inspection_required"
  due_date: string
  priority: "high" | "medium" | "low"
}

function EquipmentManagementDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    category: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: 0,
    maintenance_schedule_months: 6,
    location: "",
    assigned_to: "",
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: "",
    description: "",
    cost: 0,
    performed_by: "",
    parts_replaced: "",
  })

  useEffect(() => {
    loadEquipmentData()
  }, [])

  const loadEquipmentData = async () => {
    try {
      setLoading(true)

      // Load equipment
      const equipmentResponse = await fetch("/api/admin/equipment")
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData)
      }

      // Load maintenance records
      const maintenanceResponse = await fetch("/api/admin/equipment/maintenance")
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json()
        setMaintenanceRecords(maintenanceData)
      }

      // Load maintenance alerts
      const alertsResponse = await fetch("/api/admin/equipment/alerts")
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setMaintenanceAlerts(alertsData)
      }
    } catch (error) {
      console.error("Error loading equipment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentForm),
      })

      if (response.ok) {
        await loadEquipmentData()
        setShowAddDialog(false)
        setEquipmentForm({
          name: "",
          category: "",
          model: "",
          serial_number: "",
          purchase_date: "",
          purchase_cost: 0,
          maintenance_schedule_months: 6,
          location: "",
          assigned_to: "",
        })
        alert("Equipment added successfully!")
      }
    } catch (error) {
      console.error("Error adding equipment:", error)
      alert("Error adding equipment")
    }
  }

  const handleMaintenanceRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipment) return

    try {
      const response = await fetch("/api/admin/equipment/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...maintenanceForm,
          equipment_id: selectedEquipment.id,
          parts_replaced: maintenanceForm.parts_replaced.split(",").map((p) => p.trim()),
        }),
      })

      if (response.ok) {
        await loadEquipmentData()
        setShowMaintenanceDialog(false)
        setMaintenanceForm({
          maintenance_type: "",
          description: "",
          cost: 0,
          performed_by: "",
          parts_replaced: "",
        })
        setSelectedEquipment(null)
        alert("Maintenance record added successfully!")
      }
    } catch (error) {
      console.error("Error adding maintenance record:", error)
      alert("Error adding maintenance record")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "maintenance":
        return <Wrench className="w-4 h-4 text-yellow-500" />
      case "repair":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "retired":
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "repair":
        return "bg-red-100 text-red-800"
      case "retired":
        return "bg-gray-100 text-gray-800"
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

  const calculateDepreciation = (equipment: Equipment) => {
    const purchaseDate = new Date(equipment.purchase_date)
    const currentDate = new Date()
    const yearsOld = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    const depreciationRate = 0.15 // 15% per year
    const depreciatedValue = equipment.purchase_cost * Math.pow(1 - depreciationRate, yearsOld)
    return Math.max(depreciatedValue, equipment.purchase_cost * 0.1) // Minimum 10% of original value
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading equipment data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Equipment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                <p className="text-2xl font-bold">{equipment.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Equipment</p>
                <p className="text-2xl font-bold">{equipment.filter((e) => e.status === "active").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Alerts</p>
                <p className="text-2xl font-bold">{maintenanceAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${equipment.reduce((sum, e) => sum + calculateDepreciation(e), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Equipment Management Tabs */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Equipment Inventory</CardTitle>
                  <CardDescription>Manage your equipment assets and tracking</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Equipment</DialogTitle>
                      <DialogDescription>Enter equipment details for asset tracking</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddEquipment} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Equipment Name</Label>
                          <Input
                            id="name"
                            value={equipmentForm.name}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={equipmentForm.category}
                            onValueChange={(value) => setEquipmentForm({ ...equipmentForm, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Grinders">Grinders</SelectItem>
                              <SelectItem value="Mixers">Mixers</SelectItem>
                              <SelectItem value="Sprayers">Sprayers</SelectItem>
                              <SelectItem value="Compressors">Compressors</SelectItem>
                              <SelectItem value="Vehicles">Vehicles</SelectItem>
                              <SelectItem value="Tools">Tools</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={equipmentForm.model}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="serial_number">Serial Number</Label>
                          <Input
                            id="serial_number"
                            value={equipmentForm.serial_number}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="purchase_date">Purchase Date</Label>
                          <Input
                            id="purchase_date"
                            type="date"
                            value={equipmentForm.purchase_date}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, purchase_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="purchase_cost">Purchase Cost</Label>
                          <Input
                            id="purchase_cost"
                            type="number"
                            value={equipmentForm.purchase_cost}
                            onChange={(e) =>
                              setEquipmentForm({ ...equipmentForm, purchase_cost: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={equipmentForm.location}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, location: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maintenance_schedule">Maintenance Schedule (months)</Label>
                          <Input
                            id="maintenance_schedule"
                            type="number"
                            value={equipmentForm.maintenance_schedule_months}
                            onChange={(e) =>
                              setEquipmentForm({
                                ...equipmentForm,
                                maintenance_schedule_months: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Equipment</Button>
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
                    <TableHead>Equipment</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.model} - {item.serial_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.next_maintenance).toLocaleDateString()}</TableCell>
                      <TableCell>${calculateDepreciation(item).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEquipment(item)
                              setShowMaintenanceDialog(true)
                            }}
                          >
                            <Wrench className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
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

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>Track maintenance history and schedule future services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{equipment.find((e) => e.id === record.equipment_id)?.name || "Unknown"}</TableCell>
                      <TableCell>{record.maintenance_type}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>${record.cost.toLocaleString()}</TableCell>
                      <TableCell>{record.performed_by}</TableCell>
                      <TableCell>{new Date(record.next_due).toLocaleDateString()}</TableCell>
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
              <CardTitle>Maintenance Alerts</CardTitle>
              <CardDescription>Equipment requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{alert.equipment_name}</p>
                        <p className="text-sm text-gray-600">{alert.alert_type.replace("_", " ")}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(alert.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                      <Button size="sm">Schedule</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>Usage and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipment.slice(0, 5).map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Costs</CardTitle>
                <CardDescription>Monthly maintenance expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>This Month</span>
                  <span className="font-medium">
                    ${maintenanceRecords.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Monthly</span>
                  <span className="font-medium">$3,200</span>
                </div>
                <div className="flex justify-between">
                  <span>YTD Total</span>
                  <span className="font-medium">$28,500</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Cost per Equipment</span>
                  <span>${equipment.length > 0 ? (28500 / equipment.length).toLocaleString() : 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Maintenance</DialogTitle>
            <DialogDescription>Add maintenance record for {selectedEquipment?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMaintenanceRecord} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maintenance_type">Maintenance Type</Label>
                <Select
                  value={maintenanceForm.maintenance_type}
                  onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine Maintenance">Routine Maintenance</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Calibration">Calibration</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="performed_by">Performed By</Label>
                <Input
                  id="performed_by"
                  value={maintenanceForm.performed_by}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="parts_replaced">Parts Replaced (comma separated)</Label>
                <Input
                  id="parts_replaced"
                  value={maintenanceForm.parts_replaced}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, parts_replaced: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowMaintenanceDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Maintenance</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { EquipmentManagementDashboard }
export default EquipmentManagementDashboard
