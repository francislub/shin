import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { predictStudentPerformance } from "@/lib/ai-utils"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        sclass: true,
        examResults: {
          include: {
            exam: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        attendanceRecords: {
          orderBy: {
            date: "desc",
          },
          take: 30, // Last 30 attendance records
        },
        reportCards: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3, // Last 3 report cards
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Prepare student data for prediction
    const studentData = {
      name: student.name,
      class: student.sclass.sclassName,
      // Calculate attendance rate
      attendanceRate:
        student.attendanceRecords.length > 0
          ? (student.attendanceRecords.filter((record) => record.status === "Present").length /
              student.attendanceRecords.length) *
            100
          : 0,
      // Group exam results by subject
      subjectPerformance: student.examResults.reduce((acc: any, result) => {
        const subjectName = result.exam.subject.subName
        if (!acc[subjectName]) {
          acc[subjectName] = []
        }
        acc[subjectName].push({
          examName: result.exam.examName,
          marksObtained: result.marksObtained,
          totalMarks: result.exam.totalMarks,
          percentage: (result.marksObtained / result.exam.totalMarks) * 100,
        })
        return acc
      }, {}),
      // Recent report card data
      recentReportCards: student.reportCards.map((report) => ({
        termAverage: report.termAverage,
        classRank: report.classRank,
        conductGrade: report.conductGrade,
      })),
      // Behavioral data
      behavior: {
        discipline: student.discipline || "Good",
        timeManagement: student.timeManagement || "Good",
        smartness: student.smartness || "Good",
      },
    }

    // Use AI to predict performance
    const prediction = await predictStudentPerformance(studentData)

    return NextResponse.json({
      studentData,
      prediction,
    })
  } catch (error) {
    console.error("Error in performance prediction:", error)
    return NextResponse.json({ error: "Failed to predict student performance" }, { status: 500 })
  }
}
