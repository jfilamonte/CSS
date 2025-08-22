import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Epoxy Flooring Blog & Case Studies | Crafted Surface Solutions",
  description: "Expert insights, project case studies, and tips for epoxy flooring and concrete resurfacing projects.",
  keywords: "epoxy flooring blog, concrete resurfacing tips, flooring case studies, installation guides",
}

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "5 Signs Your Garage Floor Needs Epoxy Coating",
      excerpt: "Learn the key indicators that it's time to upgrade your garage floor with professional epoxy coating.",
      image: "garage floor showing wear and damage before epoxy coating",
      category: "Maintenance",
      author: "Mike Johnson",
      date: "2024-01-15",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Commercial Warehouse Transformation: 50,000 Sq Ft Project",
      excerpt: "A detailed case study of our largest commercial epoxy flooring project, completed in just 5 days.",
      image: "large commercial warehouse with new epoxy flooring installation",
      category: "Case Study",
      author: "Sarah Chen",
      date: "2024-01-10",
      readTime: "8 min read",
    },
    {
      id: 3,
      title: "Metallic Epoxy vs. Standard Epoxy: Which is Right for You?",
      excerpt: "Compare the benefits, costs, and applications of metallic and standard epoxy flooring systems.",
      image: "side by side comparison of metallic and standard epoxy floors",
      category: "Guide",
      author: "David Rodriguez",
      date: "2024-01-05",
      readTime: "6 min read",
    },
    {
      id: 4,
      title: "Winter Concrete Preparation: Best Practices",
      excerpt: "Essential tips for preparing concrete surfaces during cold weather months for optimal results.",
      image: "concrete preparation work in winter conditions",
      category: "Tips",
      author: "Mike Johnson",
      date: "2023-12-28",
      readTime: "4 min read",
    },
    {
      id: 5,
      title: "ROI of Commercial Epoxy Flooring: Real Numbers",
      excerpt: "Analyze the actual return on investment from our commercial clients who upgraded to epoxy flooring.",
      image: "modern commercial space with polished epoxy floors",
      category: "Business",
      author: "Sarah Chen",
      date: "2023-12-20",
      readTime: "7 min read",
    },
    {
      id: 6,
      title: "DIY vs Professional Installation: The True Cost",
      excerpt: "Breaking down the real costs and risks of DIY epoxy installation versus professional services.",
      image: "professional epoxy installation team at work",
      category: "Guide",
      author: "David Rodriguez",
      date: "2023-12-15",
      readTime: "5 min read",
    },
  ]

  const categories = ["All", "Case Study", "Guide", "Tips", "Maintenance", "Business"]

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Case Studies</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Expert insights, project showcases, and practical tips for epoxy flooring success
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-green-100"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card key={post.id} className="h-full hover:shadow-lg transition-shadow">
                  <div className="aspect-video">
                    <Image
                      src={`/abstract-geometric-shapes.png?height=200&width=350&query=${post.image}`}
                      alt={post.title}
                      width={350}
                      height={200}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-gray-600 mb-4 flex-1">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
                    >
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
