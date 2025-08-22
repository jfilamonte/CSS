"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Globe,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Link,
  ImageIcon,
  Code,
} from "lucide-react"

interface SEOData {
  page: string
  title: string
  description: string
  keywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  canonicalUrl: string
  structuredData: string
}

interface SEOAnalysis {
  score: number
  issues: Array<{
    type: "error" | "warning" | "success"
    message: string
    impact: "high" | "medium" | "low"
  }>
  recommendations: string[]
}

export default function SEOManager() {
  const [activeTab, setActiveTab] = useState("meta-tags")
  const [selectedPage, setSelectedPage] = useState("homepage")
  const [seoData, setSeoData] = useState<Record<string, SEOData>>({})
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  const pages = [
    { id: "homepage", name: "Homepage", url: "/" },
    { id: "services", name: "Services", url: "/services" },
    { id: "about", name: "About Us", url: "/about" },
    { id: "contact", name: "Contact", url: "/contact" },
    { id: "quote", name: "Get Quote", url: "/quote" },
  ]

  useEffect(() => {
    // Initialize default SEO data
    const defaultSEOData: Record<string, SEOData> = {
      homepage: {
        page: "Homepage",
        title: "Professional Epoxy Flooring Services | Crafted Surface Solutions",
        description:
          "Transform your floors with premium epoxy coatings. Residential & commercial epoxy flooring installation. Free estimates. 5-year warranty. Call (555) 123-4567",
        keywords: "epoxy flooring, garage floor coating, commercial flooring, residential epoxy, floor installation",
        ogTitle: "Professional Epoxy Flooring Services | Crafted Surface Solutions",
        ogDescription: "Transform your floors with premium epoxy coatings. Free estimates & 5-year warranty.",
        ogImage: "/css-logo.png",
        canonicalUrl: "https://craftedsurface.com/",
        structuredData: JSON.stringify(
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Crafted Surface Solutions",
            description: "Professional epoxy flooring services",
            telephone: "(555) 123-4567",
            address: {
              "@type": "PostalAddress",
              streetAddress: "123 Business Ave",
              addressLocality: "City",
              addressRegion: "ST",
              postalCode: "12345",
            },
          },
          null,
          2,
        ),
      },
      services: {
        page: "Services",
        title: "Epoxy Flooring Services | Garage, Commercial & Industrial Coatings",
        description:
          "Complete epoxy flooring solutions: garage floors, commercial warehouses, retail spaces, and industrial facilities. Professional installation with lifetime support.",
        keywords: "epoxy services, garage floor epoxy, commercial flooring, industrial coatings, floor resurfacing",
        ogTitle: "Professional Epoxy Flooring Services",
        ogDescription: "Complete epoxy flooring solutions for residential and commercial properties.",
        ogImage: "/services-hero.jpg",
        canonicalUrl: "https://craftedsurface.com/services",
        structuredData: JSON.stringify(
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Epoxy Flooring Installation",
            provider: {
              "@type": "LocalBusiness",
              name: "Crafted Surface Solutions",
            },
            serviceType: "Floor Installation",
            areaServed: "Local Area",
          },
          null,
          2,
        ),
      },
    }
    setSeoData(defaultSEOData)
  }, [])

  const updateSEOData = (page: string, field: keyof SEOData, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [field]: value,
      },
    }))
  }

  const analyzeSEO = async (page: string) => {
    setLoading(true)

    // Simulate SEO analysis
    setTimeout(() => {
      const data = seoData[page]
      if (!data) return

      const issues: SEOAnalysis["issues"] = []
      let score = 100

      // Title analysis
      if (!data.title) {
        issues.push({
          type: "error",
          message: "Missing page title",
          impact: "high",
        })
        score -= 20
      } else if (data.title.length < 30) {
        issues.push({
          type: "warning",
          message: "Title is too short (recommended: 30-60 characters)",
          impact: "medium",
        })
        score -= 10
      } else if (data.title.length > 60) {
        issues.push({
          type: "warning",
          message: "Title is too long (recommended: 30-60 characters)",
          impact: "medium",
        })
        score -= 10
      } else {
        issues.push({
          type: "success",
          message: "Title length is optimal",
          impact: "low",
        })
      }

      // Description analysis
      if (!data.description) {
        issues.push({
          type: "error",
          message: "Missing meta description",
          impact: "high",
        })
        score -= 15
      } else if (data.description.length < 120) {
        issues.push({
          type: "warning",
          message: "Description is too short (recommended: 120-160 characters)",
          impact: "medium",
        })
        score -= 8
      } else if (data.description.length > 160) {
        issues.push({
          type: "warning",
          message: "Description is too long (recommended: 120-160 characters)",
          impact: "medium",
        })
        score -= 8
      } else {
        issues.push({
          type: "success",
          message: "Meta description length is optimal",
          impact: "low",
        })
      }

      // Keywords analysis
      if (!data.keywords) {
        issues.push({
          type: "warning",
          message: "No keywords specified",
          impact: "medium",
        })
        score -= 5
      }

      // Open Graph analysis
      if (!data.ogTitle || !data.ogDescription) {
        issues.push({
          type: "warning",
          message: "Missing Open Graph tags",
          impact: "medium",
        })
        score -= 10
      }

      // Structured data analysis
      if (!data.structuredData) {
        issues.push({
          type: "warning",
          message: "No structured data found",
          impact: "medium",
        })
        score -= 10
      } else {
        try {
          JSON.parse(data.structuredData)
          issues.push({
            type: "success",
            message: "Valid structured data found",
            impact: "low",
          })
        } catch {
          issues.push({
            type: "error",
            message: "Invalid structured data JSON",
            impact: "medium",
          })
          score -= 15
        }
      }

      const recommendations = [
        "Include target keywords in title and description",
        "Add alt text to all images",
        "Optimize page loading speed",
        "Create internal linking structure",
        "Add customer reviews and testimonials",
        "Implement local SEO optimization",
      ]

      setSeoAnalysis({
        score: Math.max(0, score),
        issues,
        recommendations,
      })
      setLoading(false)
    }, 1500)
  }

  const generateSitemap = async () => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
  <url>
    <loc>https://craftedsurface.com${page.url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.id === "homepage" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("")}
</urlset>`

    // In real app, save to public/sitemap.xml
    console.log("Generated sitemap:", sitemap)
    alert("Sitemap generated! In a real app, this would be saved to public/sitemap.xml")
  }

  const generateRobotsTxt = async () => {
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://craftedsurface.com/sitemap.xml

# Block admin areas
Disallow: /admin-new/
Disallow: /api/

# Allow important pages
Allow: /
Allow: /services
Allow: /about
Allow: /contact
Allow: /quote`

    console.log("Generated robots.txt:", robotsTxt)
    alert("Robots.txt generated! In a real app, this would be saved to public/robots.txt")
  }

  const currentPageData = seoData[selectedPage]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO Management</h2>
          <p className="text-gray-600">Optimize your website for search engines</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={generateSitemap} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Sitemap
          </Button>
          <Button onClick={generateRobotsTxt} variant="outline">
            <Code className="w-4 h-4 mr-2" />
            Generate Robots.txt
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meta-tags" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Meta Tags</span>
          </TabsTrigger>
          <TabsTrigger value="structured-data" className="flex items-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Structured Data</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>SEO Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>SEO Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* Page Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Page to Optimize</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pages.map((page) => (
                <Button
                  key={page.id}
                  variant={selectedPage === page.id ? "default" : "outline"}
                  onClick={() => setSelectedPage(page.id)}
                  className="flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>{page.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Meta Tags Tab */}
        <TabsContent value="meta-tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Configuration</CardTitle>
              <CardDescription>
                Configure title, description, and other meta tags for {pages.find((p) => p.id === selectedPage)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPageData && (
                <>
                  {/* Basic Meta Tags */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={currentPageData.title}
                        onChange={(e) => updateSEOData(selectedPage, "title", e.target.value)}
                        placeholder="Enter page title (30-60 characters)"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Recommended: 30-60 characters</span>
                        <span className={currentPageData.title.length > 60 ? "text-red-500" : "text-green-500"}>
                          {currentPageData.title.length}/60
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Meta Description</Label>
                      <Textarea
                        id="description"
                        value={currentPageData.description}
                        onChange={(e) => updateSEOData(selectedPage, "description", e.target.value)}
                        placeholder="Enter meta description (120-160 characters)"
                        rows={3}
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Recommended: 120-160 characters</span>
                        <span className={currentPageData.description.length > 160 ? "text-red-500" : "text-green-500"}>
                          {currentPageData.description.length}/160
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        value={currentPageData.keywords}
                        onChange={(e) => updateSEOData(selectedPage, "keywords", e.target.value)}
                        placeholder="Enter keywords separated by commas"
                      />
                    </div>

                    <div>
                      <Label htmlFor="canonical">Canonical URL</Label>
                      <Input
                        id="canonical"
                        value={currentPageData.canonicalUrl}
                        onChange={(e) => updateSEOData(selectedPage, "canonicalUrl", e.target.value)}
                        placeholder="https://craftedsurface.com/page"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Open Graph Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Open Graph (Social Media)</h3>

                    <div>
                      <Label htmlFor="og-title">OG Title</Label>
                      <Input
                        id="og-title"
                        value={currentPageData.ogTitle}
                        onChange={(e) => updateSEOData(selectedPage, "ogTitle", e.target.value)}
                        placeholder="Title for social media sharing"
                      />
                    </div>

                    <div>
                      <Label htmlFor="og-description">OG Description</Label>
                      <Textarea
                        id="og-description"
                        value={currentPageData.ogDescription}
                        onChange={(e) => updateSEOData(selectedPage, "ogDescription", e.target.value)}
                        placeholder="Description for social media sharing"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="og-image">OG Image URL</Label>
                      <Input
                        id="og-image"
                        value={currentPageData.ogImage}
                        onChange={(e) => updateSEOData(selectedPage, "ogImage", e.target.value)}
                        placeholder="/path/to/social-image.jpg"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Search Result Preview</h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                        {currentPageData.title || "Page Title"}
                      </div>
                      <div className="text-green-700 text-sm">
                        {currentPageData.canonicalUrl || "https://craftedsurface.com/page"}
                      </div>
                      <div className="text-gray-700 text-sm mt-1">
                        {currentPageData.description || "Meta description will appear here..."}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structured Data Tab */}
        <TabsContent value="structured-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data (Schema.org)</CardTitle>
              <CardDescription>Add structured data to help search engines understand your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPageData && (
                <>
                  <div>
                    <Label htmlFor="structured-data">JSON-LD Structured Data</Label>
                    <Textarea
                      id="structured-data"
                      value={currentPageData.structuredData}
                      onChange={(e) => updateSEOData(selectedPage, "structuredData", e.target.value)}
                      placeholder="Enter JSON-LD structured data"
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        try {
                          JSON.parse(currentPageData.structuredData)
                          alert("Valid JSON structure!")
                        } catch {
                          alert("Invalid JSON structure. Please check your syntax.")
                        }
                      }}
                      variant="outline"
                    >
                      Validate JSON
                    </Button>
                    <Button
                      onClick={() => {
                        const url = `https://search.google.com/test/rich-results?url=${encodeURIComponent(currentPageData.canonicalUrl)}`
                        window.open(url, "_blank")
                      }}
                      variant="outline"
                    >
                      Test with Google
                    </Button>
                  </div>

                  {/* Common Schema Templates */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Common Schema Templates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const localBusinessSchema = {
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            name: "Crafted Surface Solutions",
                            description: "Professional epoxy flooring services",
                            telephone: "(555) 123-4567",
                            address: {
                              "@type": "PostalAddress",
                              streetAddress: "123 Business Ave",
                              addressLocality: "City",
                              addressRegion: "ST",
                              postalCode: "12345",
                            },
                            geo: {
                              "@type": "GeoCoordinates",
                              latitude: "40.7128",
                              longitude: "-74.0060",
                            },
                            openingHours: "Mo-Fr 08:00-17:00",
                            priceRange: "$$",
                          }
                          updateSEOData(selectedPage, "structuredData", JSON.stringify(localBusinessSchema, null, 2))
                        }}
                      >
                        Local Business
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const serviceSchema = {
                            "@context": "https://schema.org",
                            "@type": "Service",
                            name: "Epoxy Flooring Installation",
                            description: "Professional epoxy floor coating and installation services",
                            provider: {
                              "@type": "LocalBusiness",
                              name: "Crafted Surface Solutions",
                            },
                            serviceType: "Floor Installation",
                            areaServed: "Local Area",
                            hasOfferCatalog: {
                              "@type": "OfferCatalog",
                              name: "Epoxy Flooring Services",
                              itemListElement: [
                                {
                                  "@type": "Offer",
                                  itemOffered: {
                                    "@type": "Service",
                                    name: "Residential Garage Epoxy",
                                  },
                                },
                              ],
                            },
                          }
                          updateSEOData(selectedPage, "structuredData", JSON.stringify(serviceSchema, null, 2))
                        }}
                      >
                        Service
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>SEO Analysis</CardTitle>
                  <CardDescription>Analyze and improve your page's SEO performance</CardDescription>
                </div>
                <Button onClick={() => analyzeSEO(selectedPage)} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze Page"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {seoAnalysis && (
                <>
                  {/* SEO Score */}
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">{seoAnalysis.score}/100</div>
                    <Progress value={seoAnalysis.score} className="w-full" />
                    <p className="text-sm text-gray-600">
                      {seoAnalysis.score >= 80
                        ? "Excellent"
                        : seoAnalysis.score >= 60
                          ? "Good"
                          : seoAnalysis.score >= 40
                            ? "Needs Improvement"
                            : "Poor"}{" "}
                      SEO Score
                    </p>
                  </div>

                  <Separator />

                  {/* Issues */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Issues & Recommendations</h3>
                    {seoAnalysis.issues.map((issue, index) => (
                      <Alert
                        key={index}
                        className={
                          issue.type === "error"
                            ? "border-red-200 bg-red-50"
                            : issue.type === "warning"
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-green-200 bg-green-50"
                        }
                      >
                        <div className="flex items-start space-x-2">
                          {issue.type === "error" ? (
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          ) : issue.type === "warning" ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <AlertDescription className="text-sm">{issue.message}</AlertDescription>
                            <Badge
                              variant="outline"
                              className={`mt-1 text-xs ${
                                issue.impact === "high"
                                  ? "border-red-300 text-red-700"
                                  : issue.impact === "medium"
                                    ? "border-yellow-300 text-yellow-700"
                                    : "border-green-300 text-green-700"
                              }`}
                            >
                              {issue.impact} impact
                            </Badge>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>

                  <Separator />

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">General Recommendations</h3>
                    <ul className="space-y-2">
                      {seoAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {!seoAnalysis && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Click "Analyze Page" to get SEO insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Sitemap Generator
                </CardTitle>
                <CardDescription>Generate XML sitemap for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Pages to include:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {pages.map((page) => (
                      <li key={page.id}>
                        {page.name} ({page.url})
                      </li>
                    ))}
                  </ul>
                </div>
                <Button onClick={generateSitemap} className="w-full">
                  Generate Sitemap
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Robots.txt Generator
                </CardTitle>
                <CardDescription>Generate robots.txt file for web crawlers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Configuration:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Allow all public pages</li>
                    <li>Block admin areas</li>
                    <li>Include sitemap reference</li>
                  </ul>
                </div>
                <Button onClick={generateRobotsTxt} className="w-full">
                  Generate Robots.txt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Link className="w-5 h-5 mr-2" />
                  External Tools
                </CardTitle>
                <CardDescription>Quick access to SEO analysis tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("https://search.google.com/search-console", "_blank")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Google Search Console
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("https://pagespeed.web.dev/", "_blank")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  PageSpeed Insights
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open("https://search.google.com/test/rich-results", "_blank")}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Rich Results Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Image Optimization
                </CardTitle>
                <CardDescription>Tips for optimizing images for SEO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Best Practices:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use descriptive file names</li>
                    <li>Add alt text to all images</li>
                    <li>Optimize file sizes (WebP format)</li>
                    <li>Use appropriate dimensions</li>
                    <li>Include images in sitemap</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
