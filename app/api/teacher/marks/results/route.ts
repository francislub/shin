import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { calculateGrade } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const subjectId = searchParams.get("subjectId")
    const examType = searchParams.get("examType")

    if (!classId || !subjectId || !examType) {
      return NextResponse.json({ error: "Class ID, Subject ID, and Exam Type are required" }, { status: 400 })
    }

    console.log("Fetching results for class:", classId, "subject:", subjectId, "examType:", examType)

    // Get exam results for the specified criteria
    const results = await prisma.examResult.findMany({
      where: {
        subjectId: subjectId,
        student: {
          sclassId: classId,
        },
        exam: {
          examType: examType,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        subject: {
          select: {
            id: true,
            subName: true,
            subCode: true,
          },
        },
        exam: {
          select: {
            id: true,
            examType: true,
            examName: true,
          },
        },
      },
      orderBy: {
        student: {
          rollNum: "asc",
        },
      },
    })

    console.log("Found results:", results.length)

    return NextResponse.json({
      success: true,
      results: results || [],
    })
  } catch (error) {
    console.error("Get results error:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { classId, subjectId, examType, totalMarks, students } = body

    if (!classId || !subjectId || !examType || !totalMarks || !students || !Array.isArray(students)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Saving marks for:", { classId, subjectId, examType, totalMarks, studentsCount: students.length })

    // Get teacher details to get schoolId
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      select: { schoolId: true },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get the current term (using status field from your schema)
    const currentTerm = await prisma.term.findFirst({
      where: {
        status: "Active",
        schoolId: teacher.schoolId,
      },
    })

    if (!currentTerm) {
      return NextResponse.json({ error: "No current term found" }, { status: 400 })
    }

    // Find or create the exam for this examType, subject, and term
    let exam = await prisma.exam.findFirst({
      where: {
        examType: examType,
        subjectId: subjectId,
        sclassId: classId,
        termId: currentTerm.id,
      },
    })

    if (!exam) {
      // Create a new exam if it doesn't exist
      exam = await prisma.exam.create({
        data: {
          examName: `${examType} - ${new Date().getFullYear()}`,
          examType: examType,
          subjectId: subjectId,
          sclassId: classId,
          termId: currentTerm.id,
          schoolId: teacher.schoolId,
          teacherId: decoded.id,
          totalMarks: totalMarks,
          passingMarks: Math.floor(totalMarks * 0.4), // 40% passing marks
          startDate: new Date(),
          endDate: new Date(),
        },
      })
    }

    // Process each student's marks
    const results = []

    for (const studentData of students) {
      const { studentId, marksObtained } = studentData

      if (!studentId || marksObtained === undefined || marksObtained === null) {
        continue
      }

      const grade = calculateGrade(marksObtained, totalMarks)

      // Check if result already exists
      const existingResult = await prisma.examResult.findFirst({
        where: {
          studentId: studentId,
          examId: exam.id,
          subjectId: subjectId,
        },
      })

      if (existingResult) {
        // Update existing result
        const updatedResult = await prisma.examResult.update({
          where: {
            id: existingResult.id,
          },
          data: {
            marksObtained: marksObtained,
            grade: grade,
          },
          include: {
            student: {
              select: {
                name: true,
                rollNum: true,
              },
            },
          },
        })
        results.push(updatedResult)
      } else {
        // Create new result
        const newResult = await prisma.examResult.create({
          data: {
            studentId: studentId,
            examId: exam.id,
            subjectId: subjectId,
            marksObtained: marksObtained,
            grade: grade,
            teacherId: decoded.id,
          },
          include: {
            student: {
              select: {
                name: true,
                rollNum: true,
              },
            },
          },
        })
        results.push(newResult)
      }
    }

    console.log("Successfully saved marks for", results.length, "students")

    return NextResponse.json({
      success: true,
      message: `Successfully saved marks for ${results.length} students`,
      results: results,
    })
  } catch (error) {
    console.error("Save marks error:", error)
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 })
  }
}
