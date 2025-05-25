import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get basic teacher stats
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      include: {
        teachSclass: {
          include: {
            students: true,
          },
        },
        exams: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get attendance stats for current month
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        teacherId: decoded.id,
        date: {
          gte: startOfMonth,
          lte: today,
        },
      },
    })

    const stats = {
      totalStudents: teacher.teachSclass.students.length,
      totalExams: teacher.exams.length,
      attendanceRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter((record) => record.status === "Present").length,
      absentCount: attendanceRecords.filter((record) => record.status === "Absent").length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching teacher stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
