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

    if (!decoded || decoded.role !== "Student") {
      return NextResponse.json({ error: "Unauthorized: Invalid token or not a student" }, { status: 401 })
    }

    const studentId = decoded.id

    // Get student's subjects
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        sclass: {
          include: {
            subjects: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const subjectCount = student.sclass?.subjects.length || 0

    // Calculate attendance percentage
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
    })

    const totalRecords = attendanceRecords.length
    const presentRecords = attendanceRecords.filter((record) => record.status === "present").length
    const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

    // Get average grade
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        exam: true,
      },
    })

    let averageGrade = "-"
    if (examResults.length > 0) {
      const totalMarks = examResults.reduce((sum, result) => sum + result.marksObtained, 0)
      const totalMaxMarks = examResults.reduce((sum, result) => sum + result.exam.maxMarks, 0)
      const percentage = Math.round((totalMarks / totalMaxMarks) * 100)

      // Convert percentage to grade
      if (percentage >= 90) averageGrade = "A+"
      else if (percentage >= 80) averageGrade = "A"
      else if (percentage >= 70) averageGrade = "B+"
      else if (percentage >= 60) averageGrade = "B"
      else if (percentage >= 50) averageGrade = "C"
      else if (percentage >= 40) averageGrade = "D"
      else averageGrade = "F"
    }

    // Get notice count
    const noticeCount = await prisma.notice.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
        // Add logic for unread notices if you have that feature
      },
    })

    // Get complaint count
    const complaintCount = await prisma.complaint.count({
      where: {
        studentId: studentId,
        status: "active",
      },
    })

    return NextResponse.json({
      subjectCount,
      attendancePercentage,
      averageGrade,
      noticeCount,
      complaintCount,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
