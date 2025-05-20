import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeAttendancePatterns } from "@/lib/ai-utils"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { schoolId, classId, period } = await request.json()

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "term":
        startDate.setMonth(now.getMonth() - 4) // Approximately one term
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1) // Default to 1 month
    }

    // Build where clause
    const whereClause: any = {
      schoolId,
      date: {
        gte: startDate,
        lte: now,
      },
    }

    if (classId) {
      whereClause.sclassId = classId
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Group attendance by student
    const studentAttendance: Record<string, any> = {}

    attendanceRecords.forEach((record) => {
      if (!studentAttendance[record.studentId]) {
        studentAttendance[record.studentId] = {
          student: record.student,
          class: record.sclass,
          records: [],
          summary: {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            other: 0,
          },
        }
      }

      studentAttendance[record.studentId].records.push({
        date: record.date,
        status: record.status,
        remarks: record.remarks,
      })

      studentAttendance[record.studentId].summary.total += 1

      if (record.status === "Present") {
        studentAttendance[record.studentId].summary.present += 1
      } else if (record.status === "Absent") {
        studentAttendance[record.studentId].summary.absent += 1
      } else if (record.status === "Late") {
        studentAttendance[record.studentId].summary.late += 1
      } else {
        studentAttendance[record.studentId].summary.other += 1
      }
    })

    // Calculate attendance rates and identify at-risk students
    const attendanceData = Object.values(studentAttendance).map((data: any) => {
      const attendanceRate = data.summary.total > 0 ? (data.summary.present / data.summary.total) * 100 : 0

      return {
        ...data,
        attendanceRate,
        isAtRisk: attendanceRate < 80, // Flag students with less than 80% attendance
      }
    })

    // Use AI to analyze attendance patterns
    const analysis = await analyzeAttendancePatterns({
      period,
      totalStudents: attendanceData.length,
      averageAttendanceRate:
        attendanceData.length > 0
          ? attendanceData.reduce((sum: number, student: any) => sum + student.attendanceRate, 0) /
            attendanceData.length
          : 0,
      atRiskCount: attendanceData.filter((student: any) => student.isAtRisk).length,
      studentAttendance: attendanceData,
    })

    return NextResponse.json({
      attendanceData,
      analysis,
    })
  } catch (error) {
    console.error("Error in attendance insights:", error)
    return NextResponse.json({ error: "Failed to analyze attendance data" }, { status: 500 })
  }
}
