import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Teacher Marks Students API Called ===")

    // Get parameters from query
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const subjectId = searchParams.get("subjectId")
    const examType = searchParams.get("examType")

    console.log("Query parameters:", { classId, subjectId, examType })

    if (!classId || !subjectId || !examType) {
      console.log("ERROR: Missing required parameters")
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "classId, subjectId, and examType are required",
        },
        { status: 400 },
      )
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("ERROR: Invalid or missing authorization header")
      return NextResponse.json(
        {
          error: "No token provided",
          details: "Authorization header is missing or invalid",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
      console.log("Token decoded for user:", decoded.id, "role:", decoded.role)
    } catch (jwtError: any) {
      console.log("ERROR: JWT verification failed:", jwtError.message)
      return NextResponse.json(
        {
          error: "Invalid token",
          details: jwtError.message,
        },
        { status: 401 },
      )
    }

    if (decoded.role !== "Teacher") {
      console.log("ERROR: User is not a teacher:", decoded.role)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Only teachers can access this endpoint",
        },
        { status: 403 },
      )
    }

    console.log("Fetching students for class:", classId)

    // Get all students in the class with their existing exam results
    // Note: examType is on the Exam model, not ExamResult model
    const students = await prisma.student.findMany({
      where: {
        sclassId: classId,
      },
      include: {
        examResults: {
          where: {
            subjectId: subjectId,
            exam: {
              examType: examType,
            },
          },
          include: {
            exam: {
              select: {
                id: true,
                examType: true,
                examName: true,
                totalMarks: true,
              },
            },
            subject: {
              select: {
                id: true,
                subName: true,
                subCode: true,
              },
            },
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
        rollNum: "asc",
      },
    })

    console.log("Students found:", students.length)

    // Transform data to include existing marks
    const transformedStudents = students.map((student) => {
      // Find the exam result for this specific subject and exam type
      const existingResult = student.examResults.find(
        (result) => result.subjectId === subjectId && result.exam.examType === examType,
      )

      return {
        id: student.id,
        name: student.name,
        rollNum: student.rollNum,
        admissionNumber: student.admissionNumber,
        photo: student.photo,
        class: {
          id: student.sclass?.id,
          name: student.sclass?.sclassName,
        },
        existingMarks: existingResult
          ? {
              id: existingResult.id,
              marksObtained: existingResult.marksObtained,
              totalMarks: existingResult.exam.totalMarks,
              percentage: existingResult.exam.totalMarks
                ? Math.round((existingResult.marksObtained / existingResult.exam.totalMarks) * 100)
                : 0,
              grade: existingResult.grade,
              examId: existingResult.exam.id,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      students: transformedStudents,
      debug: {
        teacherId: decoded.id,
        classId,
        subjectId,
        examType,
        studentCount: students.length,
      },
    })
  } catch (error: any) {
    console.log("ERROR: Unexpected error in teacher marks students API:", error.message)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
