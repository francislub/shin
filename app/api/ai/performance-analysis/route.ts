import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzePerformanceData } from "@/lib/ai-utils"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { schoolId, classId, termId, subjectId } = await request.json()

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // Fetch exam results with filters
    const whereClause: any = {
      exam: {
        schoolId,
      },
    }

    if (classId) {
      whereClause.exam.sclassId = classId
    }

    if (termId) {
      whereClause.exam.termId = termId
    }

    if (subjectId) {
      whereClause.subjectId = subjectId
    }

    // Get exam results
    const examResults = await prisma.examResult.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        exam: {
          select: {
            id: true,
            examName: true,
            examType: true,
            totalMarks: true,
            passingMarks: true,
            subject: {
              select: {
                id: true,
                subName: true,
                subCode: true,
              },
            },
            sclass: {
              select: {
                id: true,
                sclassName: true,
              },
            },
            term: {
              select: {
                id: true,
                termName: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate performance metrics
    const performanceData = {
      totalStudents: new Set(examResults.map((result) => result.studentId)).size,
      totalExams: new Set(examResults.map((result) => result.examId)).size,
      averageScore:
        examResults.length > 0
          ? examResults.reduce((sum, result) => sum + result.marksObtained, 0) / examResults.length
          : 0,
      passingRate:
        examResults.length > 0
          ? (examResults.filter((result) => result.marksObtained >= (result.exam?.passingMarks || 0)).length /
              examResults.length) *
            100
          : 0,
      examResults: examResults.map((result) => ({
        studentName: result.student.name,
        examName: result.exam.examName,
        subjectName: result.exam.subject.subName,
        marksObtained: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        percentage: (result.marksObtained / result.exam.totalMarks) * 100,
        grade: result.grade || "N/A",
      })),
    }

    // Use AI to analyze the performance data
    const analysis = await analyzePerformanceData(performanceData)

    return NextResponse.json({
      performanceData,
      analysis,
    })
  } catch (error) {
    console.error("Error in performance analysis:", error)
    return NextResponse.json({ error: "Failed to analyze performance data" }, { status: 500 })
  }
}
