import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific subject
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

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        sclassName: true,
        teacher: true,
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Get subject error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching subject" }, { status: 500 })
  }
}

// Update a subject
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
    const { subName, subCode, sessions, sclassId, teacherId } = body

    // Prepare update data
    const updateData: any = {}

    if (subName) updateData.subName = subName
    if (subCode) updateData.subCode = subCode
    if (sessions) updateData.sessions = sessions

    // Update class if provided
    if (sclassId) {
      updateData.sclassName = {
        connect: { id: sclassId },
      }
    }

    // Update teacher if provided
    if (teacherId) {
      updateData.teacher = {
        connect: { id: teacherId },
      }
    } else if (teacherId === null) {
      updateData.teacher = {
        disconnect: true,
      }
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: params.id },
      data: updateData,
      include: {
        sclassName: true,
        teacher: true,
      },
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error("Update subject error:", error)
    return NextResponse.json({ error: "Something went wrong while updating subject" }, { status: 500 })
  }
}

// Delete a subject
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

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Delete subject error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting subject" }, { status: 500 })
  }
}
