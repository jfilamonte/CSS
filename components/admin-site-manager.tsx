"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Save, Globe, Search, Settings, ImageIcon, Phone } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SiteSettings {
  key: string
  value: string
  type: string
  category: string
}

interface SEOData {
  page: string
  title: string
  description: string
  keywords: string
  og_image?: string
  canonical_url?: string
}

export default function AdminSiteManager() {
  const [settings, setSettings] = useState<SiteSettings[]>([])
  const [seoData, setSeoData] = useState<SEOData>({
    page: "homepage",
    title: "",
    description: "",
    keywords: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchSEOData("homepage")
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/site-settings")
      const data = await response.json()
      setSettings(data.settings || [])
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load site settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSEOData = async (page: string) => {
    try {
      const response = await fetch(`/api/admin/seo?page=${page}`)
      const data = await response.json()
      setSeoData(data.seoData || { page, title: "", description: "", keywords: "" })
    } catch (error) {
      console.error("Error fetching SEO data:", error)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((setting) => (setting.key === key ? { ...setting, value } : setting)))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Site settings updated successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveSEO = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seoData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "SEO settings updated successfully",
        })
      } else {
        throw new Error("Failed to save SEO data")
      }
    } catch (error) {
      console.error("Error saving SEO data:", error)
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (key: string) => {
    return settings.find((s) => s.key === key)?.value ?? ""
  }

  if (loading) {
    return <div className="p-6">Loading site management...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Website Management</h2>
          <p className="text-gray-600">Manage site content, SEO, and settings</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Live Website
        </Badge>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Homepage Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Hero Title</Label>
                <Input
                  id="hero-title"
                  value={getSetting("hero_title")}
                  onChange={(e) => updateSetting("hero_title", e.target.value)}
                  placeholder="Transform Your Floors with Premium Epoxy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  value={getSetting("hero_subtitle")}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  placeholder="From residential garages to commercial warehouses..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features-title">Features Section Title</Label>
                <Input
                  id="features-title"
                  value={getSetting("features_title")}
                  onChange={(e) => updateSetting("features_title", e.target.value)}
                  placeholder="Why Choose Our Epoxy Solutions?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="services-title">Services Section Title</Label>
                <Input
                  id="services-title"
                  value={getSetting("services_title")}
                  onChange={(e) => updateSetting("services_title", e.target.value)}
                  placeholder="Our Services"
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className="bg-green-800 hover:bg-green-900">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Content"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Page Title</Label>
                <Input
                  id="seo-title"
                  value={seoData.title}
                  onChange={(e) => setSeoData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Professional Epoxy Flooring Services | Crafted Surface Solutions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoData.description}
                  onChange={(e) => setSeoData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Transform your floors with premium epoxy solutions. Professional installation, lifetime durability..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Keywords</Label>
                <Input
                  id="seo-keywords"
                  value={seoData.keywords}
                  onChange={(e) => setSeoData((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="epoxy flooring, garage floors, commercial flooring, concrete resurfacing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  value={seoData.og_image || ""}
                  onChange={(e) => setSeoData((prev) => ({ ...prev, og_image: e.target.value }))}
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>

              <Button onClick={saveSEO} disabled={saving} className="bg-green-800 hover:bg-green-900">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save SEO Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={getSetting("company_name")}
                  onChange={(e) => updateSetting("company_name", e.target.value)}
                  placeholder="Crafted Surface Solutions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-tagline">Company Tagline</Label>
                <Input
                  id="company-tagline"
                  value={getSetting("company_tagline")}
                  onChange={(e) => updateSetting("company_tagline", e.target.value)}
                  placeholder="Concrete Resurfacing & Epoxy Floors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={getSetting("phone")}
                    onChange={(e) => updateSetting("phone", e.target.value)}
                    placeholder="(413) 497-2100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={getSetting("email")}
                    onChange={(e) => updateSetting("email", e.target.value)}
                    placeholder="sales@craftedsurfacesolutions.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Service Area</Label>
                <Input
                  id="address"
                  value={getSetting("service_area")}
                  onChange={(e) => updateSetting("service_area", e.target.value)}
                  placeholder="Servicing the Northeast and beyond!"
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className="bg-green-800 hover:bg-green-900">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Contact Info"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-image">Hero Section Image URL</Label>
                <Input
                  id="hero-image"
                  value={getSetting("hero_image")}
                  onChange={(e) => updateSetting("hero_image", e.target.value)}
                  placeholder="/modern-garage-epoxy.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">Company Logo URL</Label>
                <Input
                  id="logo-url"
                  value={getSetting("logo_url")}
                  onChange={(e) => updateSetting("logo_url", e.target.value)}
                  placeholder="/css-logo.png"
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className="bg-green-800 hover:bg-green-900">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Media Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
