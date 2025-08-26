"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, Edit, Trash2, ArrowLeft, Grid, List, Search, Filter, Move, Tag, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { logError } from "@/lib/error-logger"

interface GalleryImage {
  id: string
  title: string
  description: string
  url: string
  category: string
  tags: string[]
  project_id?: string
  created_at: string
  file_size: number
  dimensions: string
}

export default function GalleryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const categories = [
    "all",
    "residential",
    "commercial",
    "industrial",
    "before-after",
    "process",
    "materials",
    "equipment",
  ]

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      const response = await fetch("/api/admin/gallery")
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        const errorData = await response.text()
        await logError(new Error(`Failed to load gallery images: ${response.status} ${errorData}`), "error", {
          action: "load_gallery_images",
          status: response.status,
        })
        setImages([])
      }
    } catch (error) {
      console.error("Failed to load images:", error)
      await logError(error as Error, "error", {
        action: "load_gallery_images",
        context: "network_error",
      })
      setImages([])
    }
    setLoading(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", categoryFilter !== "all" ? categoryFilter : "general")

      try {
        const response = await fetch("/api/admin/gallery/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }
        return await response.json()
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error)
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
        return null
      }
    })

    try {
      await Promise.all(uploadPromises)
      toast({
        title: "Success",
        description: `Uploaded ${files.length} image(s) successfully`,
        variant: "default",
      })
      loadImages()
    } catch (error) {
      console.error("Bulk upload error:", error)
    }
    setUploading(false)
  }

  const handleImageUpdate = async (imageId: string, updates: Partial<GalleryImage>) => {
    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image updated successfully",
          variant: "default",
        })
        loadImages()
        setEditingImage(null)
      } else {
        throw new Error("Failed to update image")
      }
    } catch (error) {
      console.error("Update failed:", error)
      toast({
        title: "Error",
        description: "Failed to update image",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return

    try {
      const response = await fetch("/api/admin/gallery/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: selectedImages }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Deleted ${selectedImages.length} image(s)`,
          variant: "default",
        })
        setSelectedImages([])
        loadImages()
      } else {
        throw new Error("Bulk delete failed")
      }
    } catch (error) {
      console.error("Bulk delete failed:", error)
      toast({
        title: "Error",
        description: "Failed to delete selected images",
        variant: "destructive",
      })
    }
  }

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || image.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/admin-new")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <Button disabled={uploading} className="bg-green-600 hover:bg-green-700">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Images"}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search images by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedImages.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedImages.length} image(s) selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button size="sm" variant="outline">
                  <Move className="h-4 w-4 mr-2" />
                  Move to Category
                </Button>
                <Button size="sm" variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
              </div>
            </div>
          )}
        </div>

        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {filteredImages.length > 0 ? (
            filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img src={image.url || "/placeholder.svg"} alt={image.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedImages.includes(image.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedImages([...selectedImages, image.id])
                        } else {
                          setSelectedImages(selectedImages.filter((id) => id !== image.id))
                        }
                      }}
                      className="bg-white"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {image.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 truncate">{image.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{image.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {image.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {image.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{image.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{image.title}</DialogTitle>
                          </DialogHeader>
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={image.title}
                            className="w-full max-h-96 object-contain"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" onClick={() => setEditingImage(image)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-gray-500">{image.dimensions}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || categoryFilter !== "all"
                  ? "No images match your filters."
                  : "No images found. Upload some images to get started."}
              </p>
            </div>
          )}
        </div>

        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
            </DialogHeader>
            {editingImage && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingImage.title}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingImage.description}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingImage.category}
                    onValueChange={(value) => setEditingImage({ ...editingImage, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat) => cat !== "all")
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editingImage.tags.join(", ")}
                    onChange={(e) =>
                      setEditingImage({
                        ...editingImage,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="residential, kitchen, modern"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingImage(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleImageUpdate(editingImage.id, editingImage)}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
