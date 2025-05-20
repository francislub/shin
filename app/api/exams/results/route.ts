import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
    const termId = req.nextUrl.searchParams.get("termId")
    const examType = req.nextUrl.searchParams.get("examType")
    const subjectId = req.nextUrl.searchParams.get("subjectId")

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const whereClause: any = {
      studentId: studentId,
    }

    if (termId) {
      whereClause.termId = termId
    }

    if (examType && examType !== "All") {
      whereClause.examType = examType
    }

    if (subjectId) {
      whereClause.subjectId = subjectId
    }

    const results = await prisma.examResult.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            id: true,
            subName: true,
            subCode: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
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
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching exam results:", error)
    return NextResponse.json({ error: "Failed to fetch exam results" }, { status: 500 })
  }
}

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
    const { studentId, subjectId, termId, examType, date, totalMarks, passingMarks, marksObtained, remarks } = body

    // Validate required fields
    if (!studentId || !subjectId || !termId || !examType || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new exam result
    const result = await prisma.examResult.create({
      data: {
        studentId,
        subjectId,
        termId,
        examType,
        date: new Date(date),
        totalMarks: totalMarks || 100,
        passingMarks: passingMarks || 40,
        marksObtained,
        remarks: remarks || "",
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating exam result:", error)
    return NextResponse.json({ error: "Failed to create exam result" }, { status: 500 })
  }
}
