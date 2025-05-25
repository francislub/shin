import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        schoolId: session.id,
      },
      include: {
        subject: true,
        sclass: true,
        term: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
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
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error("Error fetching exam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      examName,
      examType,
      startDate,
      endDate,
      totalMarks,
      passingMarks,
      subjectId,
      sclassId,
      termId,
      teacherId,
    } = body

    const exam = await prisma.exam.update({
      where: {
        id: params.id,
      },
      data: {
        examName,
        examType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalMarks: parseInt(totalMarks),
        passingMarks: parseInt(passingMarks),
        subjectId,
        sclassId,
        termId,
        teacherId,
      },
      include: {
        subject: true,
        sclass: true,
        term: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error("Error updating exam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.exam.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Exam deleted successfully" })
  } catch (error) {
    console.error("Error deleting exam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
