import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now(), userId: user.id })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))

        // Set up periodic heartbeat and stats updates
        const heartbeat = setInterval(async () => {
          try {
            // Send heartbeat
            const heartbeatData = `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatData))

            // Send live stats update for admin users
            if (user.role === "ADMIN" || user.role === "STAFF") {
              const stats = await getLiveStats()
              const statsData = `data: ${JSON.stringify({ type: "stats_update", stats, timestamp: Date.now() })}\n\n`
              controller.enqueue(new TextEncoder().encode(statsData))
            }

            // Check for new notifications
            const newNotifications = await getNewNotifications(user.id)
            if (newNotifications.length > 0) {
              newNotifications.forEach((notification) => {
                const notificationData = `data: ${JSON.stringify({
                  type: "notification",
                  notification,
                  timestamp: Date.now(),
                })}\n\n`
                controller.enqueue(new TextEncoder().encode(notificationData))
              })
            }

            // Send project updates for customers
            if (user.role === "CUSTOMER") {
              const projectUpdates = await getProjectUpdates(user.id)
              if (projectUpdates.length > 0) {
                projectUpdates.forEach((update) => {
                  const updateData = `data: ${JSON.stringify({
                    type: "project_update",
                    update,
                    timestamp: Date.now(),
                  })}\n\n`
                  controller.enqueue(new TextEncoder().encode(updateData))
                })
              }
            }
          } catch (error) {
            console.error("SSE update error:", error)
          }
        }, 30000) // 30 seconds

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  } catch (error) {
    console.error("SSE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getLiveStats() {
  try {
    const [leadsCount, quotesCount, projectsCount, revenueSum] = await Promise.all([
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.quote.count({ where: { status: "SENT" } }),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.aggregate({
        _sum: { totalCost: true },
        where: { status: "COMPLETED" },
      }),
    ])

    return {
      newLeadsToday: leadsCount,
      quotesAwaitingApproval: quotesCount,
      projectsInProgress: projectsCount,
      totalRevenue: revenueSum._sum.totalCost || 0,
      activeUsers: Math.floor(Math.random() * 10) + 1, // Simulated for demo
    }
  } catch (error) {
    console.error("Error fetching live stats:", error)
    return {}
  }
}

async function getNewNotifications(userId: string) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return await prisma.notification.findMany({
      where: {
        user_id: userId,
        is_read: false,
        created_at: { gte: fiveMinutesAgo },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    })
  } catch (error) {
    console.error("Error fetching new notifications:", error)
    return []
  }
}

async function getProjectUpdates(customerId: string) {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return await prisma.project.findMany({
      where: {
        customerId,
        updatedAt: { gte: fiveMinutesAgo },
      },
      include: {
        quote: true,
      },
      take: 3,
    })
  } catch (error) {
    console.error("Error fetching project updates:", error)
    return []
  }
}
