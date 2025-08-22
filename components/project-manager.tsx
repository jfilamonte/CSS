"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, DollarSign, MapPin, FileText, Camera, CheckCircle } from "lucide-react"
import { createProject, updateProject, getProjects, addProjectNote } from "@/lib/database-actions"

interface Project {
  id: string
  customer_id: string
  customer_name: string
  project_name: string
  project_type: string
  status: "planning" | "in_progress" | "completed" | "on_hold"
  start_date: string
  end_date: string
  budget: number
  actual_cost: number
  progress: number
  location: string
  description: string
  notes: Array<{
    id: string
    note: string
    created_at: string
    created_by: string
  }>
  photos: Array<{
    id: string
    url: string
    caption: string
    uploaded_at: string
  }>
  materials: Array<{
    id: string
    name: string
    quantity: number
    cost: number
    supplier: string
  }>
  timeline: Array<{
    id: string
    phase: string
    start_date: string
    end_date: string
    status: string
    description: string
  }>
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const newProject = await createProject(projectData)
      setProjects([...projects, newProject])
      setIsCreating(false)
    } catch (error) {
      console.error("Error creating project:", error)
    }
  }

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await updateProject(projectId, updates)
      setProjects(projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)))
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, ...updates })
      }
    } catch (error) {
      console.error("Error updating project:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "on_hold":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading projects...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button onClick={() => setIsCreating(true)}>Create New Project</Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm onSubmit={handleCreateProject} onCancel={() => setIsCreating(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Click a project to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProject?.id === project.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{project.project_name}</h3>
                    <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{project.customer_name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />${project.budget?.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedProject ? (
            <ProjectDetails
              project={selectedProject}
              onUpdate={(updates) => handleUpdateProject(selectedProject.id, updates)}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-gray-500">Select a project to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectForm({
  onSubmit,
  onCancel,
  project,
}: {
  onSubmit: (data: Partial<Project>) => void
  onCancel: () => void
  project?: Project
}) {
  const [formData, setFormData] = useState({
    project_name: project?.project_name || "",
    customer_name: project?.customer_name || "",
    project_type: project?.project_type || "",
    location: project?.location || "",
    description: project?.description || "",
    budget: project?.budget || 0,
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project_name">Project Name</Label>
          <Input
            id="project_name"
            value={formData.project_name}
            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="customer_name">Customer Name</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project_type">Project Type</Label>
          <Select
            value={formData.project_type}
            onValueChange={(value) => setFormData({ ...formData, project_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential_epoxy">Residential Epoxy</SelectItem>
              <SelectItem value="commercial_epoxy">Commercial Epoxy</SelectItem>
              <SelectItem value="concrete_resurfacing">Concrete Resurfacing</SelectItem>
              <SelectItem value="decorative_concrete">Decorative Concrete</SelectItem>
              <SelectItem value="repair_restoration">Repair & Restoration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">{project ? "Update Project" : "Create Project"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ProjectDetails({
  project,
  onUpdate,
}: {
  project: Project
  onUpdate: (updates: Partial<Project>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newNote, setNewNote] = useState("")

  const handleStatusChange = (status: string) => {
    onUpdate({ status: status as Project["status"] })
  }

  const handleProgressChange = (progress: number) => {
    onUpdate({ progress })
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      await addProjectNote(project.id, newNote)
      // Refresh project data
      setNewNote("")
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{project.project_name}</CardTitle>
            <CardDescription>
              {project.customer_name} • {project.location}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <ProjectForm
            project={project}
            onSubmit={(updates) => {
              onUpdate(updates)
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project Status</Label>
                  <Select value={project.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Progress: {project.progress}%</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={project.progress} className="flex-1" />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={project.progress}
                      onChange={(e) => handleProgressChange(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-gray-600">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-gray-600">{new Date(project.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-gray-600">${project.budget?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-3">
                {project.timeline?.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle
                      className={`h-5 w-5 ${phase.status === "completed" ? "text-green-500" : "text-gray-300"}`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{phase.phase}</h4>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(phase.start_date).toLocaleDateString()} -{" "}
                        {new Date(phase.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <div className="space-y-3">
                {project.materials?.map((material) => (
                  <div key={material.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{material.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {material.quantity}</p>
                      <p className="text-xs text-gray-500">Supplier: {material.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${material.cost.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.photos?.map((photo) => (
                  <div key={photo.id} className="space-y-2">
                    <img
                      src={photo.url || "/placeholder.svg"}
                      alt={photo.caption}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-600">{photo.caption}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                <Camera className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-3">
                {project.notes?.map((note) => (
                  <div key={note.id} className="p-3 border rounded-lg">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.created_at).toLocaleDateString()} by {note.created_by}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddNote}>
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "planning":
      return "bg-blue-100 text-blue-800"
    case "in_progress":
      return "bg-yellow-100 text-yellow-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "on_hold":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
