import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const photos = await db.projectPhotos.findManyWithJoin(
      {},
      {
        join: {
          project: {
            select: ["id", "title"],
            where: { customerId: user.id },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    )

    const formattedPhotos = photos.map((photo) => ({
      id: `${photo.project.id}-${photo.id}`,
      url: photo.imageUrl,
      caption: photo.caption || photo.project.title,
      uploadDate: photo.createdAt.toISOString(),
      phase: photo.phase || "Progress",
    }))

    return NextResponse.json(formattedPhotos)
  } catch (error) {
    console.error("Error fetching project photos:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
