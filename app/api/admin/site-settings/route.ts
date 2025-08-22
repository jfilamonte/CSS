import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || !["admin", "staff"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.siteSettings.findMany({
      orderBy: { key: "asc" },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching site settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()

    // Update settings in batch
    const updatePromises = settings.map((setting: any) =>
      prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          updated_at: new Date(),
        },
        create: {
          key: setting.key,
          value: setting.value,
          type: setting.type || "text",
          category: setting.category || "general",
        },
      }),
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating site settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
