import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const subjectId = searchParams.get("subjectId")
    const examType = searchParams.get("examType")

    if (!classId || !subjectId || !examType) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get existing exam results
    const examResults = await prisma.examResult.findMany({
      where: {
        exam: {
          examType: examType,
          subjectId: subjectId,
          sclassId: classId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            rollNum: true,
            photoUrl: true,
          },
        },
        exam: {
          select: {
            id: true,
            examName: true,
            examType: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: {
        student: {
          rollNum: "asc",
        },
      },
    })

    // Transform the data to match the expected format
    const transformedResults = examResults.map((result) => ({
      id: result.id,
      marksObtained: result.marksObtained,
      grade: result.grade,
      student: {
        id: result.student.id,
        firstName: result.student.firstName,
        lastName: result.student.lastName,
        admissionNumber: result.student.admissionNumber,
        rollNumber: result.student.rollNum,
        photoUrl: result.student.photoUrl,
      },
      exam: result.exam,
    }))

    return NextResponse.json(transformedResults)
  } catch (error) {
    console.error("Error fetching exam results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { examName, examType, totalMarks, subjectId, classId, results } = body

    if (!examName || !examType || !totalMarks || !subjectId || !classId || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if exam already exists
    let exam = await prisma.exam.findFirst({
      where: {
        examType,
        subjectId,
        sclassId: classId,
      },
    })

    // Create or update exam
    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          examName,
          examType,
          startDate: new Date(),
          endDate: new Date(),
          totalMarks,
          passingMarks: Math.floor(totalMarks * 0.4), // 40% passing
          subjectId,
          sclassId: classId,
          schoolId: decoded.schoolId, // Assuming teacher has schoolId
        },
      })
    } else {
      exam = await prisma.exam.update({
        where: { id: exam.id },
        data: {
          examName,
          totalMarks,
          passingMarks: Math.floor(totalMarks * 0.4),
        },
      })
    }

    // Delete existing results for this exam
    await prisma.examResult.deleteMany({
      where: {
        examId: exam.id,
      },
    })

    // Calculate grades and create new results
    const examResultsData = results.map((result: any) => {
      const percentage = (result.marks / totalMarks) * 100
      let grade = "F"

      if (percentage >= 90) grade = "A+"
      else if (percentage >= 80) grade = "A"
      else if (percentage >= 70) grade = "B+"
      else if (percentage >= 60) grade = "B"
      else if (percentage >= 50) grade = "C+"
      else if (percentage >= 40) grade = "C"

      return {
        examId: exam.id,
        studentId: result.studentId,
        marksObtained: result.marks,
        grade,
      }
    })

    // Create new results
    await prisma.examResult.createMany({
      data: examResultsData,
    })

    return NextResponse.json({ message: "Exam results saved successfully" })
  } catch (error) {
    console.error("Error saving exam results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
