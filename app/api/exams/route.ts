import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get exam results for a student or class
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const studentId = req.nextUrl.searchParams.get("studentId")
    const sclassId = req.nextUrl.searchParams.get("sclassId")
    const examType = req.nextUrl.searchParams.get("examType")

    if (!studentId && !sclassId) {
      return NextResponse.json({ error: "Student ID or Class ID is required" }, { status: 400 })
    }

    if (!examType || !["bot", "mid", "end"].includes(examType)) {
      return NextResponse.json({ error: "Valid exam type (bot, mid, end) is required" }, { status: 400 })
    }

    // Query parameters for filtering
    const whereClause: any = {}

    if (studentId) {
      whereClause.id = studentId
    }

    if (sclassId) {
      whereClause.sclassId = sclassId
    }

    // Get students with exam results
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        rollNum: true,
        botExamResult: examType === "bot",
        midExamResult: examType === "mid",
        endExamResult: examType === "end",
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
    })

    // Get subjects for reference
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        subName: true,
        subCode: true,
      },
    })

    // Map subject IDs to names for better readability
    const subjectMap = subjects.reduce(
      (map, subject) => {
        map[subject.id] = {
          name: subject.subName,
          code: subject.subCode,
        }
        return map
      },
      {} as Record<string, { name: string; code: string }>,
    )

    // Format the results
    const result = students.map((student) => {
      let examResults: any[] = []

      if (examType === "bot") {
        examResults = student.botExamResult || []
      } else if (examType === "mid") {
        examResults = student.midExamResult || []
      } else if (examType === "end") {
        examResults = student.endExamResult || []
      }

      // Add subject names to results
      const formattedResults = examResults.map((result) => ({
        ...result,
        subjectName: subjectMap[result.subName]?.name || "Unknown Subject",
        subjectCode: subjectMap[result.subName]?.code || "N/A",
      }))

      return {
        id: student.id,
        name: student.name,
        rollNum: student.rollNum,
        sclass: student.sclass,
        examResults: formattedResults,
        totalMarks: formattedResults.reduce((sum, result) => sum + (result.marksObtained || 0), 0),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get exam results error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching exam results" }, { status: 500 })
  }
}

// Record exam results for students
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { examType, subjectId, resultsData } = body

    if (!examType || !["bot", "mid", "end"].includes(examType)) {
      return NextResponse.json({ error: "Valid exam type (bot, mid, end) is required" }, { status: 400 })
    }

    if (!subjectId || !resultsData || !Array.isArray(resultsData)) {
      return NextResponse.json({ error: "Invalid exam results data" }, { status: 400 })
    }

    const results = []

    // Process each student's exam result
    for (const item of resultsData) {
      const { studentId, marksObtained } = item

      if (!studentId || marksObtained === undefined) {
        continue
      }

      // Get the student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          botExamResult: examType === "bot",
          midExamResult: examType === "mid",
          endExamResult: examType === "end",
        },
      })

      if (!student) {
        continue
      }

      let examResults: any[] = []

      if (examType === "bot") {
        examResults = student.botExamResult || []
      } else if (examType === "mid") {
        examResults = student.midExamResult || []
      } else if (examType === "end") {
        examResults = student.endExamResult || []
      }

      // Filter out any existing result for this subject
      const updatedResults = examResults.filter((r) => r.subName !== subjectId)

      // Add the new result
      updatedResults.push({
        subName: subjectId,
        marksObtained: Number.parseInt(marksObtained),
      })

      // Update the student's exam results
      const updateData: any = {}

      if (examType === "bot") {
        updateData.botExamResult = updatedResults
      } else if (examType === "mid") {
        updateData.midExamResult = updatedResults
      } else if (examType === "end") {
        updateData.endExamResult = updatedResults
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: updateData,
        select: { id: true, name: true, rollNum: true },
      })

      results.push({
        ...updatedStudent,
        marksObtained,
      })
    }

    return NextResponse.json({
      message: "Exam results recorded successfully",
      examType,
      subject: subjectId,
      students: results,
    })
  } catch (error) {
    console.error("Record exam results error:", error)
    return NextResponse.json({ error: "Something went wrong while recording exam results" }, { status: 500 })
  }
}
