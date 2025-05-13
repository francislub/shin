import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Update student exam results
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

    const studentId = params.id
    const body = await req.json()
    const { examType, results } = body

    if (!examType || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Format results
    const formattedResults = results.map((result) => ({
      subName: result.subjectId,
      marksObtained: result.marks,
    }))

    // Update student results based on exam type
    let updateData = {}

    if (examType === "bot") {
      updateData = { botExamResult: formattedResults }
    } else if (examType === "mid") {
      updateData = { midExamResult: formattedResults }
    } else if (examType === "end") {
      updateData = { endExamResult: formattedResults }
    } else {
      return NextResponse.json({ error: "Invalid exam type" }, { status: 400 })
    }

    // Update student
    await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    })

    return NextResponse.json({
      message: `${examType.toUpperCase()} exam results updated successfully`,
    })
  } catch (error) {
    console.error("Update student results error:", error)
    return NextResponse.json({ error: "Something went wrong while updating student results" }, { status: 500 })
  }
}
