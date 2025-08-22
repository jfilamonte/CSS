import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const seoSettings = (await prisma.seoSettings.findFirst()) || {
      pageTitle: "Professional Epoxy Flooring | Crafted Surface Solutions",
      metaDescription:
        "Transform your space with professional epoxy flooring solutions. Durable, beautiful floors for residential and commercial properties.",
      keywords: "epoxy flooring, garage floors, commercial flooring, decorative concrete",
      ogTitle: "Professional Epoxy Flooring Services",
      ogDescription: "Expert epoxy flooring installation and repair services",
      ogImage: "",
    }

    return NextResponse.json(seoSettings)
  } catch (error) {
    console.error("Error fetching SEO settings:", error)
    return NextResponse.json({ error: "Failed to fetch SEO settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const data = await request.json()

    const seoSettings = await prisma.seoSettings.upsert({
      where: { id: data.id || "default" },
      update: data,
      create: { ...data, id: "default" },
    })

    return NextResponse.json(seoSettings)
  } catch (error) {
    console.error("Error updating SEO settings:", error)
    return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 })
  }
}
