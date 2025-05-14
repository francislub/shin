import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Update student conduct
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
    const { discipline, timeManagement, smartness, attendanceRemarks } = body

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update student conduct
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        discipline,
        timeManagement,
        smartness,
        attendanceRemarks,
      },
    })

    return NextResponse.json({
      message: "Student conduct updated successfully",
      conduct: {
        discipline: updatedStudent.discipline,
        timeManagement: updatedStudent.timeManagement,
        smartness: updatedStudent.smartness,
        attendanceRemarks: updatedStudent.attendanceRemarks,
      },
    })
  } catch (error) {
    console.error("Update student conduct error:", error)
    return NextResponse.json({ error: "Something went wrong while updating student conduct" }, { status: 500 })
  }
}
