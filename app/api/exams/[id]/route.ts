import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific exam result
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

    const examResult = await prisma.examResult.findUnique({
      where: { id: params.id },
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
    })

    if (!examResult) {
      return NextResponse.json({ error: "Exam result not found" }, { status: 404 })
    }

    return NextResponse.json(examResult)
  } catch (error) {
    console.error("Get exam result error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching exam result" }, { status: 500 })
  }
}

// Update a specific exam result
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { marks, totalMarks, remarks } = body

    if (marks === undefined || totalMarks === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate grade based on marks percentage
    const percentage = (marks / totalMarks) * 100
    let grade = ""

    if (percentage >= 90) grade = "A+"
    else if (percentage >= 80) grade = "A"
    else if (percentage >= 70) grade = "B+"
    else if (percentage >= 60) grade = "B"
    else if (percentage >= 50) grade = "C+"
    else if (percentage >= 40) grade = "C"
    else if (percentage >= 33) grade = "D"
    else grade = "F"

    const updatedExamResult = await prisma.examResult.update({
      where: { id: params.id },
      data: {
        marks,
        totalMarks,
        percentage: Number.parseFloat(percentage.toFixed(2)),
        grade,
        remarks,
      },
    })

    return NextResponse.json(updatedExamResult)
  } catch (error) {
    console.error("Update exam result error:", error)
    return NextResponse.json({ error: "Something went wrong while updating exam result" }, { status: 500 })
  }
}

// Delete a specific exam result
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.examResult.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Exam result deleted successfully" })
  } catch (error) {
    console.error("Delete exam result error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting exam result" }, { status: 500 })
  }
}
