"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, File, ImageIcon, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FileUploadProps {
  projectId?: string
  category?: string
  onUploadComplete?: (file: any) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export default function FileUpload({
  projectId,
  category = "general",
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ["image/*", ".pdf", ".doc", ".docx"],
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({})
  const [selectedCategory, setSelectedCategory] = useState(category)

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])

      if (files.length + selectedFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        })
        return
      }

      setFiles((prev) => [...prev, ...selectedFiles])
    },
    [files.length, maxFiles],
  )

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setDescriptions((prev) => {
      const newDescriptions = { ...prev }
      delete newDescriptions[`file-${index}`]
      return newDescriptions
    })
  }

  const updateDescription = (index: number, description: string) => {
    setDescriptions((prev) => ({
      ...prev,
      [`file-${index}`]: description,
    }))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", selectedCategory)
        formData.append("description", descriptions[`file-${index}`] || "")
        if (projectId) formData.append("projectId", projectId)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result = await response.json()
        setUploadProgress((prev) => prev + 100 / files.length)
        return result
      })

      const results = await Promise.all(uploadPromises)

      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully`,
      })

      // Reset form
      setFiles([])
      setDescriptions({})
      setUploadProgress(0)

      // Notify parent component
      results.forEach((result) => onUploadComplete?.(result))
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (file.type.includes("pdf")) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-input">Select Files</Label>
          <Input
            id="file-input"
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <p className="text-sm text-gray-500">
            Maximum {maxFiles} files. Accepted: {acceptedTypes.join(", ")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before_photos">Before Photos</SelectItem>
              <SelectItem value="progress_photos">Progress Photos</SelectItem>
              <SelectItem value="after_photos">After Photos</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="contracts">Contracts</SelectItem>
              <SelectItem value="invoices">Invoices</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <Label>Selected Files</Label>
            {files.map((file, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getFileIcon(file)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={uploading}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Textarea
                    placeholder="Add description (optional)"
                    value={descriptions[`file-${index}`] || ""}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    rows={2}
                    disabled={uploading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            className="bg-green-800 hover:bg-green-900"
          >
            {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </Button>
          {files.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setFiles([])
                setDescriptions({})
              }}
              disabled={uploading}
            >
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
