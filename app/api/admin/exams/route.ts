import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized - Invalid token or role" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sclassId = searchParams.get("sclassId")
    const subjectId = searchParams.get("subjectId")

    const where: any = {
      schoolId: decoded.id,
    }

    if (sclassId) where.sclassId = sclassId
    if (subjectId) where.subjectId = subjectId

    const exams = await prisma.exam.findMany({
      where,
      include: {
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
        subject: {
          select: {
            id: true,
            subName: true,
          },
        },
        term: {
          select: {
            id: true,
            termName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNum: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error("Error fetching exams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized - Invalid token or role" }, { status: 401 })
    }

    const body = await request.json()
    const { examName, examType, startDate, endDate, totalMarks, passingMarks, sclassId, subjectId, termId, teacherId } =
      body

    // Validate required fields
    if (
      !examName ||
      !examType ||
      !startDate ||
      !endDate ||
      !totalMarks ||
      !passingMarks ||
      !sclassId ||
      !subjectId ||
      !termId ||
      !teacherId
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 })
    }

    const exam = await prisma.exam.create({
      data: {
        examName,
        examType,
        startDate: start,
        endDate: end,
        totalMarks: Number.parseInt(totalMarks),
        passingMarks: Number.parseInt(passingMarks),
        sclassId,
        subjectId,
        termId,
        teacherId,
        schoolId: decoded.id,
      },
      include: {
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
        subject: {
          select: {
            id: true,
            subName: true,
          },
        },
        term: {
          select: {
            id: true,
            termName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error("Error creating exam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
