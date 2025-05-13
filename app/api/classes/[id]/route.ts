import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific class
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

    const sclass = await prisma.sclass.findUnique({
      where: { id: params.id },
      include: {
        term: true,
        students: true,
        subjects: {
          include: {
            teacher: true,
          },
        },
      },
    })

    if (!sclass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json(sclass)
  } catch (error) {
    console.error("Get class error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching class" }, { status: 500 })
  }
}

// Update a class
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { sclassName, termId } = body

    // Update class
    const updatedClass = await prisma.sclass.update({
      where: { id: params.id },
      data: {
        sclassName,
        ...(termId && {
          term: {
            connect: { id: termId },
          },
        }),
      },
      include: {
        term: true,
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error("Update class error:", error)
    return NextResponse.json({ error: "Something went wrong while updating class" }, { status: 500 })
  }
}

// Delete a class
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

    // Check if class exists
    const sclass = await prisma.sclass.findUnique({
      where: { id: params.id },
      include: {
        students: true,
        subjects: true,
        teachers: true,
      },
    })

    if (!sclass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class has associated students, subjects, or teachers
    if (sclass.students.length > 0 || sclass.subjects.length > 0 || sclass.teachers.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with associated students, subjects, or teachers" },
        { status: 400 },
      )
    }

    // Delete class
    await prisma.sclass.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Delete class error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting class" }, { status: 500 })
  }
}
