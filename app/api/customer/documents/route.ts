import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documents = await db.documents.findMany({ customerId: user.id }, { orderBy: { createdAt: "desc" } })

    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      name: doc.fileName,
      type: doc.documentType,
      uploadDate: doc.createdAt.toISOString(),
      downloadUrl: doc.fileUrl,
      size: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "Unknown",
    }))

    return NextResponse.json(formattedDocuments)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
