import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get marks for a specific exam
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const subjectId = req.nextUrl.searchParams.get("subjectId")

    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 })
    }

    const examMarks = await prisma.examResult.findMany({
      where: {
        examId: params.id,
        subjectId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
    })

    return NextResponse.json(examMarks)
  } catch (error) {
    console.error("Get exam marks error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching exam marks" }, { status: 500 })
  }
}

// Add or update marks for a specific exam
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { subjectId, marks } = body

    if (!subjectId || !marks || !Array.isArray(marks)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the exam to check total marks
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      select: { totalMarks: true },
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    const totalMarks = exam.totalMarks

    // First, delete existing marks for this exam and subject
    await prisma.examResult.deleteMany({
      where: {
        examId: params.id,
        subjectId,
      },
    })

    // Then create new marks
    const createdMarks = await Promise.all(
      marks.map(async (mark: { studentId: string; marks: number; remarks?: string }) => {
        // Calculate grade based on marks percentage
        const percentage = (mark.marks / totalMarks) * 100
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
            marks: mark.marks,
            totalMarks,
            percentage: Number.parseFloat(percentage.toFixed(2)),
            grade,
            remarks: mark.remarks || "",
            exam: { connect: { id: params.id } },
            subject: { connect: { id: subjectId } },
            student: { connect: { id: mark.studentId } },
            teacher: { connect: { id: decoded.id } },
          },
        })
      }),
    )

    return NextResponse.json(createdMarks, { status: 201 })
  } catch (error) {
    console.error("Add exam marks error:", error)
    return NextResponse.json({ error: "Something went wrong while adding exam marks" }, { status: 500 })
  }
}
