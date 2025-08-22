"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logError } from "@/lib/error-logger"

export default function GalleryPage() {
  const router = useRouter()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        loadImages() // Refresh the gallery
      } else {
        const errorData = await response.text()
        await logError(new Error(`File upload failed: ${response.status} ${errorData}`), "error", {
          action: "upload_gallery_image",
          filename: file.name,
        })
      }
    } catch (error) {
      console.error("Upload failed:", error)
      await logError(error as Error, "error", {
        action: "upload_gallery_image",
        filename: file.name,
      })
    }
    setUploading(false)
  }

  const handleDelete = async (imageId: number) => {
    try {
      const response = await fetch(`/api/admin/gallery/${imageId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        loadImages() // Refresh the gallery
      } else {
        const errorData = await response.text()
        await logError(new Error(`Failed to delete image: ${response.status} ${errorData}`), "error", {
          action: "delete_gallery_image",
          imageId,
        })
      }
    } catch (error) {
      console.error("Delete failed:", error)
      await logError(error as Error, "error", {
        action: "delete_gallery_image",
        imageId,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Photo Gallery Management</h1>
          <div className="flex gap-4">
            <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.length > 0 ? (
            images.map((image: any) => (
              <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img src={image.url || "/placeholder.svg"} alt={image.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{image.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{image.description}</p>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Edit</button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No images found. Upload some images to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
