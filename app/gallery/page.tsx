import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Image from "next/image"

export default function GalleryPage() {
  const projects = [
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg- text-white py-16 bg-green-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-green-800">Project Gallery</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto bg-green-800">
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
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-64">
                    <Image
                      src={project.image || "/placeholder.svg"}
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
