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

    if (!decoded || decoded.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized: Invalid token or not a teacher" }, { status: 401 })
    }

    const teacherId = decoded.id

    // Get teacher's class and subject
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        teachSclass: {
          include: {
            students: true,
          },
        },
        teachSubject: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Calculate student count
    const studentCount = teacher.teachSclass?.students.length || 0

    // Get subject name
    const subjectName = teacher.teachSubject?.subName || ""

    // Get recent notices
    const noticeCount = await prisma.notice.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
    })

    // Get unread messages
    const unreadMessageCount = await prisma.message.count({
      where: {
        recipientId: teacherId,
        read: false,
      },
    })

    // Get upcoming exams
    const upcomingExamCount = await prisma.exam.count({
      where: {
        teacherId: teacherId,
        date: {
          gte: new Date(),
        },
      },
    })

    return NextResponse.json({
      studentCount,
      subjectName,
      noticeCount,
      unreadMessageCount,
      upcomingExamCount,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
