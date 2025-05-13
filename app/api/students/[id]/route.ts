import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword } from "@/lib/auth"

// Get a specific student
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

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        sclass: true,
        complains: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Remove password from response
    const { password, verificationToken, ...studentData } = student as any

    return NextResponse.json(studentData)
  } catch (error) {
    console.error("Get student error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching student" }, { status: 500 })
  }
}

// Update a student
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "Admin" && decoded.id !== params.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, rollNum, password, sclassId, gender, discipline, timeManagement, smartness, attendanceRemarks } = body

    // Prepare update data
    const updateData: any = {}

    if (name) updateData.name = name
    if (rollNum) updateData.rollNum = rollNum
    if (gender) updateData.gender = gender
    if (discipline) updateData.discipline = discipline
    if (timeManagement) updateData.timeManagement = timeManagement
    if (smartness) updateData.smartness = smartness
    if (attendanceRemarks) updateData.attendanceRemarks = attendanceRemarks

    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }

    // Update class if provided
    if (sclassId) {
      updateData.sclass = {
        connect: { id: sclassId },
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: updateData,
      include: {
        sclass: true,
      },
    })

    // Remove password from response
    const { password: _, verificationToken, ...studentData } = updatedStudent as any

    return NextResponse.json(studentData)
  } catch (error) {
    console.error("Update student error:", error)
    return NextResponse.json({ error: "Something went wrong while updating student" }, { status: 500 })
  }
}

// Delete a student
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        complains: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Delete associated complaints
    if (student.complains.length > 0) {
      await prisma.complain.deleteMany({
        where: { userId: params.id },
      })
    }

    // Delete student
    await prisma.student.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Delete student error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting student" }, { status: 500 })
  }
}
