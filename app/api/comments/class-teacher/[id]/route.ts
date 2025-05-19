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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Get class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching comment" }, { status: 500 })
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

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If teacher, check if they own the comment
    if (decoded.role === "Teacher") {
      const comment = await prisma.classTeacherComment.findUnique({
        where: { id: params.id },
      })

      if (!comment || comment.teacherId !== decoded.id) {
        return NextResponse.json({ error: "Unauthorized to modify this comment" }, { status: 403 })
      }
    }

    const body = await req.json()
    const { from, to, comment, teacherId, schoolId } = body

    // Validate input
    if (from >= to) {
      return NextResponse.json({ error: "From value must be less than To value" }, { status: 400 })
    }

    // Check for overlapping ranges (excluding the current comment)
    const overlappingComments = await prisma.classTeacherComment.findMany({
      where: {
        schoolId,
        teacherId: teacherId || null,
        id: { not: params.id },
        OR: [
          { AND: [{ from: { lte: from } }, { to: { gte: from } }] },
          { AND: [{ from: { lte: to } }, { to: { gte: to } }] },
          { AND: [{ from: { gte: from } }, { to: { lte: to } }] },
        ],
      },
    })

    if (overlappingComments.length > 0) {
      return NextResponse.json({ error: "Comment range overlaps with existing ranges" }, { status: 400 })
    }

    // Update comment
    const updatedComment = await prisma.classTeacherComment.update({
      where: { id: params.id },
      data: {
        from,
        to,
        comment,
        teacher: teacherId ? { connect: { id: teacherId } } : { disconnect: true },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Update class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while updating comment" }, { status: 500 })
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

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If teacher, check if they own the comment
    if (decoded.role === "Teacher") {
      const comment = await prisma.classTeacherComment.findUnique({
        where: { id: params.id },
      })

      if (!comment || comment.teacherId !== decoded.id) {
        return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 })
      }
    }

    // Check if comment exists
    const comment = await prisma.classTeacherComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Delete comment
    await prisma.classTeacherComment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Delete class teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting comment" }, { status: 500 })
  }
}
