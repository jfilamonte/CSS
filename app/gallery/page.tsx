"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Image from "next/image"
import { useState, useEffect } from "react"

interface GalleryProject {
  id: string
  title: string
  url: string
  description: string
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<GalleryProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const response = await fetch("/api/gallery")
        if (response.ok) {
          const data = await response.json()
          setProjects(data.images || [])
        } else {
          console.error("Failed to load gallery images")
          // Fallback to static data if API fails
          setProjects([
            {
              id: "1",
              title: "Modern Garage Transformation",
              url: "/placeholder-rahif.png",
              description: "Metallic epoxy finish in residential garage",
            },
            {
              id: "2",
              title: "Commercial Warehouse",
              url: "/industrial-warehouse-epoxy-floor.png",
              description: "Heavy-duty epoxy system for high traffic",
            },
            {
              id: "3",
              title: "Decorative Basement Floor",
              url: "/decorative-basement-epoxy-floor.png",
              description: "Custom color blend with flake system",
            },
          ])
        }
      } catch (error) {
        console.error("Gallery load error:", error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadGalleryImages()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Project Gallery</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              See our craftsmanship in action with these completed projects
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-64">
                        <Image
                          src={project.url || "/placeholder.svg"}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">No gallery images available at this time.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
