import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let referralCode = user.referralCode

    // Generate referral code if doesn't exist
    if (!referralCode) {
      referralCode = `CSS${user.id.slice(-6).toUpperCase()}`
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
      })
    }

    return NextResponse.json({ code: referralCode })
  } catch (error) {
    console.error("Error fetching referral code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
