import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific class teacher comment
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

    const comment = await prisma.classTeacherComment.findUnique({
      where: { id: params.id },
      include: {
        teacher: true,
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Class teacher comment not found" }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Get class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching class teacher comment" }, { status: 500 })
  }
}

// Update a class teacher comment
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the comment to check permissions
    const existingComment = await prisma.classTeacherComment.findUnique({
      where: { id: params.id },
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Class teacher comment not found" }, { status: 404 })
    }

    // Only allow the teacher who created the comment or an admin to update it
    if (decoded.role !== "Admin" && (decoded.role !== "Teacher" || decoded.id !== existingComment.teacherId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { from, to, comment, teacherId } = body

    // Check for overlapping comment ranges (excluding the current comment)
    const overlappingComment = await prisma.classTeacherComment.findFirst({
      where: {
        id: { not: params.id },
        teacherId: teacherId || existingComment.teacherId,
        schoolId: existingComment.schoolId,
        OR: [
          {
            AND: [{ from: { lte: from } }, { to: { gte: from } }],
          },
          {
            AND: [{ from: { lte: to } }, { to: { gte: to } }],
          },
          {
            AND: [{ from: { gte: from } }, { to: { lte: to } }],
          },
        ],
      },
    })

    if (overlappingComment) {
      return NextResponse.json(
        { error: "Comment range overlaps with an existing comment for this teacher" },
        { status: 400 },
      )
    }

    // Prepare update data
    const updateData: any = {
      from,
      to,
      comment,
    }

    // Update teacher if provided (admin only)
    if (teacherId && decoded.role === "Admin") {
      updateData.teacher = {
        connect: { id: teacherId },
      }
    }

    // Update class teacher comment
    const updatedComment = await prisma.classTeacherComment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        teacher: true,
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Update class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while updating class teacher comment" }, { status: 500 })
  }
}

// Delete a class teacher comment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the comment to check permissions
    const comment = await prisma.classTeacherComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Class teacher comment not found" }, { status: 404 })
    }

    // Only allow the teacher who created the comment or an admin to delete it
    if (decoded.role !== "Admin" && (decoded.role !== "Teacher" || decoded.id !== comment.teacherId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete class teacher comment
    await prisma.classTeacherComment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Class teacher comment deleted successfully" })
  } catch (error) {
    console.error("Delete class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting class teacher comment" }, { status: 500 })
  }
}
