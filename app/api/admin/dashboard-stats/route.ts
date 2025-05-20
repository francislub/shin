import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Verify the token
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date for calculations
    const now = new Date()
    const currentMonth = now.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentYear = now.getFullYear()
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // First day of current month
    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1)
    // First day of previous month
    const firstDayPreviousMonth = new Date(previousYear, previousMonth, 1)

    // Get teacher counts
    const currentTeacherCount = await prisma.teacher.count()
    const previousMonthTeacherCount = await prisma.teacher.count({
      where: {
        createdAt: {
          lt: firstDayCurrentMonth,
        },
      },
    })

    // Calculate teacher growth percentage
    const teacherGrowth =
      previousMonthTeacherCount > 0
        ? Number.parseFloat(
            (((currentTeacherCount - previousMonthTeacherCount) / previousMonthTeacherCount) * 100).toFixed(1),
          )
        : 0

    // Get student counts
    const currentStudentCount = await prisma.student.count()
    const previousMonthStudentCount = await prisma.student.count({
      where: {
        createdAt: {
          lt: firstDayCurrentMonth,
        },
      },
    })

    // Calculate student growth percentage
    const studentGrowth =
      previousMonthStudentCount > 0
        ? Number.parseFloat(
            (((currentStudentCount - previousMonthStudentCount) / previousMonthStudentCount) * 100).toFixed(1),
          )
        : 0

    // Get class count
    const classCount = await prisma.sclass.count()

    // Get subject count
    const subjectCount = await prisma.subject.count()

    // Get term count for current academic year
    const termCount = await prisma.term.count({
      where: {
        status: "Active",
      },
    })

    // Get notice count for current month
    const noticeCount = await prisma.notice.count({
      where: {
        createdAt: {
          gte: firstDayCurrentMonth,
        },
      },
    })

    // Compile dashboard stats
    const dashboardStats = {
      teacherCount: currentTeacherCount,
      studentCount: currentStudentCount,
      classCount,
      subjectCount,
      termCount,
      noticeCount,
      studentGrowth,
      teacherGrowth,
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
