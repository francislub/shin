import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword } from "@/lib/auth"

// Get a specific parent
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

    const parentId = params.id

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Remove sensitive data
    const { password, verificationToken, ...parentData } = parent as any

    return NextResponse.json(parentData)
  } catch (error) {
    console.error("Get parent error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching parent" }, { status: 500 })
  }
}

// Update a parent
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

    const parentId = params.id
    const body = await req.json()
    const { name, email, password, phone, address, studentIds } = body

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: parentId },
    })

    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (name) updateData.name = name
    if (email && email !== existingParent.email) {
      // Check if email is already in use
      const emailExists = await prisma.parent.findUnique({
        where: { email },
      })

      if (emailExists && emailExists.id !== parentId) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }

      updateData.email = email
    }
    if (password) updateData.password = await hashPassword(password)
    if (phone) updateData.phone = phone
    if (address) updateData.address = address

    // Update parent
    const updatedParent = await prisma.parent.update({
      where: { id: parentId },
      data: updateData,
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
      },
    })

    // Update student connections if provided
    if (studentIds && Array.isArray(studentIds)) {
      // Get current student connections
      const currentStudents = await prisma.student.findMany({
        where: { parentId },
        select: { id: true },
      })

      const currentStudentIds = currentStudents.map((student) => student.id)

      // Determine which students to connect and disconnect
      const studentsToConnect = studentIds.filter((id: string) => !currentStudentIds.includes(id))
      const studentsToDisconnect = currentStudentIds.filter((id) => !studentIds.includes(id))

      // Connect new students
      if (studentsToConnect.length > 0) {
        await prisma.student.updateMany({
          where: { id: { in: studentsToConnect } },
          data: { parentId },
        })
      }

      // Disconnect removed students
      if (studentsToDisconnect.length > 0) {
        await prisma.student.updateMany({
          where: { id: { in: studentsToDisconnect } },
          data: { parentId: null },
        })
      }
    }

    // Remove sensitive data
    const { password: _, verificationToken: __, ...parentData } = updatedParent as any

    return NextResponse.json(parentData)
  } catch (error) {
    console.error("Update parent error:", error)
    return NextResponse.json({ error: "Something went wrong while updating parent" }, { status: 500 })
  }
}

// Delete a parent
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

    const parentId = params.id

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: parentId },
    })

    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Update students to remove parent reference
    await prisma.student.updateMany({
      where: { parentId },
      data: { parentId: null },
    })

    // Delete parent
    await prisma.parent.delete({
      where: { id: parentId },
    })

    return NextResponse.json({ message: "Parent deleted successfully" })
  } catch (error) {
    console.error("Delete parent error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting parent" }, { status: 500 })
  }
}
