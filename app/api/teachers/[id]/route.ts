import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword } from "@/lib/auth"

// Get a specific teacher
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        teachSclass: true,
        teachSubject: true,
        classTeacherComments: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Remove password from response
    const { password, verificationToken, ...teacherData } = teacher as any

    return NextResponse.json(teacherData)
  } catch (error) {
    console.error("Get teacher error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher" }, { status: 500 })
  }
}

// Update a teacher
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
    const { name, email, password, teachSclassId, teachSubjectId } = body
    const id = params.id

    // Prepare update data
    const updateData: any = {}

    if (name) updateData.name = name
    if (email) updateData.email = email

    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }

    // Update class if provided
    if (teachSclassId) {
      updateData.teachSclass = {
        connect: { id: teachSclassId },
      }
    }

    // Update subject if provided
    if (teachSubjectId) {
      updateData.teachSubject = {
        connect: { id: teachSubjectId },
      }
    }

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        teachSclass: true,
        teachSubject: true,
      },
    })

    // Remove password from response
    const { password: _, verificationToken, ...teacherData } = updatedTeacher as any

    return NextResponse.json(teacherData)
  } catch (error) {
    console.error("Update teacher error:", error)
    return NextResponse.json({ error: "Something went wrong while updating teacher" }, { status: 500 })
  }
}

// Delete a teacher
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

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        classTeacherComments: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Delete associated comments
    if (teacher.classTeacherComments.length > 0) {
      await prisma.classTeacherComment.deleteMany({
        where: { teacherId: params.id },
      })
    }

    // Update subjects taught by this teacher
    await prisma.subject.updateMany({
      where: { teacherId: params.id },
      data: { teacherId: null },
    })

    // Delete teacher
    await prisma.teacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Delete teacher error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting teacher" }, { status: 500 })
  }
}
