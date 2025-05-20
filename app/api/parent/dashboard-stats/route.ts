import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJWT } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Get token from header
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized: Invalid token or not a parent" }, { status: 401 })
    }

    const parentId = decoded.id

    // Get parent's children
    const children = await prisma.student.findMany({
      where: {
        parentId: parentId,
      },
    })

    // Get pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        parentId: parentId,
        status: "pending",
      },
    })

    // Get upcoming events
    const upcomingEvents = await prisma.event.count({
      where: {
        date: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 30)), // Next 30 days
        },
      },
    })

    // Get unread notices
    const unreadNotices = await prisma.notice.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
        // Add logic for unread notices if you have that feature
      },
    })

    return NextResponse.json({
      childrenCount: children.length,
      pendingPayments,
      upcomingEvents,
      unreadNotices,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
