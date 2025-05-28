import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const parentId = decoded.id

    if (decoded.role !== "Parent") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get children count
    const childrenCount = await prisma.student.count({
      where: {
        parentId: parentId,
      },
    })

    // Get children with their classes to calculate total subjects
    const children = await prisma.student.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        sclass: {
          include: {
            subjects: true,
          },
        },
      },
    })

    // Calculate unique subjects across all children
    const uniqueSubjects = new Set()
    children.forEach((child) => {
      child.sclass?.subjects?.forEach((subject) => {
        uniqueSubjects.add(subject.id)
      })
    })
    const totalSubjects = uniqueSubjects.size

    // Get pending payments for this parent's children
    const pendingPayments = await prisma.payment.count({
      where: {
        student: {
          parentId: parentId,
        },
        status: "Pending",
      },
    })

    // Get upcoming events (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const upcomingEvents = await prisma.notice.count({
      where: {
        date: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    })

    // Get unread notices
    const unreadNotices = await prisma.notice.count({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    })

    return NextResponse.json({
      childrenCount,
      totalSubjects,
      pendingPayments,
      upcomingEvents,
      unreadNotices,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
