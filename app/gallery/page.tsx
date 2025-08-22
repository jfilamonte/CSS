import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"

async function getGalleryImages() {
  try {
    const supabase = await createClient()

    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, title, project_photos, created_at")
      .not("project_photos", "is", null)
      .order("created_at", { ascending: false })
      .limit(12)

    if (error) {
      console.error("Database error:", error)
      return []
    }

    const images =
      projects?.flatMap((project) => {
        const photos = project.project_photos as any[]
        return (
          photos?.map((photo) => ({
            id: `${project.id}-${photo.id || Math.random()}`,
            title: photo.title || project.title,
            url: photo.url,
            description: photo.description || `Photo from ${project.title}`,
            project_id: project.id,
            created_at: project.created_at,
          })) || []
        )
      }) || []

    return images
  } catch (error) {
    console.error("Failed to fetch gallery images:", error)
    return []
  }
}

export default async function GalleryPage() {
  const galleryImages = await getGalleryImages()

  // Fallback static projects if no dynamic content
  const staticProjects = [
    {
      title: "Modern Garage Transformation",
      image: "/placeholder-rahif.png",
      description: "Metallic epoxy finish in residential garage",
    },
    {
      title: "Commercial Warehouse",
      image: "/industrial-warehouse-epoxy-floor.png",
      description: "Heavy-duty epoxy system for high traffic",
    },
    {
      title: "Decorative Basement Floor",
      image: "/decorative-basement-epoxy-floor.png",
      description: "Custom color blend with flake system",
    },
    {
      title: "Retail Store Flooring",
      image: "/placeholder-t1ang.png",
      description: "Seamless epoxy for retail environment",
    },
    {
      title: "Concrete Resurfacing",
      image: "/concrete-resurfacing.png",
      description: "Damaged concrete restored to perfection",
    },
    {
      title: "Outdoor Patio",
      image: "/outdoor-concrete-patio-epoxy.png",
      description: "Weather-resistant epoxy coating",
    },
  ]

  const projects = galleryImages.length > 0 ? galleryImages : staticProjects

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div
                  key={galleryImages.length > 0 ? project.id : index}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-64">
                    <Image
                      src={project.url || project.image || "/placeholder.svg"}
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
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
