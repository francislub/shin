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

    // Instead of directly using termId, we need to find exams for that term
    if (termId) {
      // First, find all exams for this term
      const examsForTerm = await prisma.exam.findMany({
        where: { termId: termId },
        select: { id: true },
      })

      // If exams exist for this term, filter by those exam IDs
      if (examsForTerm && examsForTerm.length > 0) {
        whereClause.examId = {
          in: examsForTerm.map((exam) => exam.id),
        }
      } else {
        // If no exams for this term, return empty results
        return NextResponse.json([])
      }
    }

    if (examType && examType !== "All") {
      // Find exams of this type
      const examsOfType = await prisma.exam.findMany({
        where: { examType: examType },
        select: { id: true },
      })

      if (examsOfType && examsOfType.length > 0) {
        // If we already have an examId filter, we need to find the intersection
        if (whereClause.examId) {
          const existingIds = new Set(whereClause.examId.in)
          whereClause.examId.in = examsOfType.map((exam) => exam.id).filter((id) => existingIds.has(id))
        } else {
          whereClause.examId = {
            in: examsOfType.map((exam) => exam.id),
          }
        }
      } else {
        // If no exams of this type, return empty results
        return NextResponse.json([])
      }
    }

    if (subjectId) {
      whereClause.subjectId = subjectId
    }

    // Add limit support
    const limit = req.nextUrl.searchParams.get("limit")
    const limitNumber = limit ? Number.parseInt(limit, 10) : undefined

    const queryOptions: any = {
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
        exam: {
          include: {
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
    }

    if (limitNumber) {
      queryOptions.take = limitNumber
    }

    const results = await prisma.examResult.findMany(queryOptions)

    // Transform the results to match the expected format
    const transformedResults = results.map((result) => ({
      ...result,
      term: result.exam?.term || null,
    }))

    return NextResponse.json(transformedResults)
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
    const { studentId, subjectId, examId, date, totalMarks, passingMarks, marksObtained, remarks } = body

    // Validate required fields
    if (!studentId || !subjectId || !examId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new exam result
    const result = await prisma.examResult.create({
      data: {
        studentId,
        subjectId,
        examId,
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
