import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get exam results
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

    const classId = req.nextUrl.searchParams.get("classId")
    const subjectId = req.nextUrl.searchParams.get("subjectId")
    const examType = req.nextUrl.searchParams.get("examType")
    const studentId = req.nextUrl.searchParams.get("studentId")
    const teacherId = req.nextUrl.searchParams.get("teacherId")

    const whereClause: any = {}

    if (classId) {
      whereClause.classId = classId
    }

    if (subjectId) {
      whereClause.subjectId = subjectId
    }

    if (examType) {
      whereClause.examType = examType
    }

    if (studentId) {
      whereClause.studentId = studentId
    }

    if (teacherId) {
      whereClause.teacherId = teacherId
    }

    const examResults = await prisma.examResult.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
      orderBy: [{ student: { firstName: "asc" } }, { student: { lastName: "asc" } }],
    })

    return NextResponse.json(examResults)
  } catch (error) {
    console.error("Get exam results error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching exam results" }, { status: 500 })
  }
}

// Create new exam results
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
    const { classId, subjectId, examType, teacherId, totalMarks, examResults } = body

    if (!classId || !subjectId || !examType || !teacherId || !totalMarks || !examResults) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create exam results for each student
    const createdResults = await Promise.all(
      examResults.map(async (result: { studentId: string; marks: number }) => {
        // Calculate grade based on marks percentage
        const percentage = (result.marks / totalMarks) * 100
        let grade = ""

        if (percentage >= 90) grade = "A+"
        else if (percentage >= 80) grade = "A"
        else if (percentage >= 70) grade = "B+"
        else if (percentage >= 60) grade = "B"
        else if (percentage >= 50) grade = "C+"
        else if (percentage >= 40) grade = "C"
        else if (percentage >= 33) grade = "D"
        else grade = "F"

        return prisma.examResult.create({
          data: {
            examType,
            marks: result.marks,
            totalMarks,
            percentage: Number.parseFloat(percentage.toFixed(2)),
            grade,
            class: { connect: { id: classId } },
            subject: { connect: { id: subjectId } },
            teacher: { connect: { id: teacherId } },
            student: { connect: { id: result.studentId } },
          },
        })
      }),
    )

    return NextResponse.json(createdResults, { status: 201 })
  } catch (error) {
    console.error("Create exam results error:", error)
    return NextResponse.json({ error: "Something went wrong while creating exam results" }, { status: 500 })
  }
}

// Update exam results
export async function PUT(req: NextRequest) {
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
    const { classId, subjectId, examType, totalMarks, examResults } = body

    if (!classId || !subjectId || !examType || !totalMarks || !examResults) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, delete existing results for this class, subject, and exam type
    await prisma.examResult.deleteMany({
      where: {
        classId,
        subjectId,
        examType,
      },
    })

    // Then create new results
    const updatedResults = await Promise.all(
      examResults.map(async (result: { studentId: string; marks: number }) => {
        // Calculate grade based on marks percentage
        const percentage = (result.marks / totalMarks) * 100
        let grade = ""

        if (percentage >= 90) grade = "A+"
        else if (percentage >= 80) grade = "A"
        else if (percentage >= 70) grade = "B+"
        else if (percentage >= 60) grade = "B"
        else if (percentage >= 50) grade = "C+"
        else if (percentage >= 40) grade = "C"
        else if (percentage >= 33) grade = "D"
        else grade = "F"

        return prisma.examResult.create({
          data: {
            examType,
            marks: result.marks,
            totalMarks,
            percentage: Number.parseFloat(percentage.toFixed(2)),
            grade,
            class: { connect: { id: classId } },
            subject: { connect: { id: subjectId } },
            teacher: { connect: { id: decoded.id } },
            student: { connect: { id: result.studentId } },
          },
        })
      }),
    )

    return NextResponse.json(updatedResults)
  } catch (error) {
    console.error("Update exam results error:", error)
    return NextResponse.json({ error: "Something went wrong while updating exam results" }, { status: 500 })
  }
}
