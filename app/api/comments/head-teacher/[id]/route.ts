import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific head teacher comment
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

    const comment = await prisma.headTeacherComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Get head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching comment" }, { status: 500 })
  }
}

// Update a head teacher comment
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
    const { from, to, comment, schoolId } = body

    // Validate input
    if (from >= to) {
      return NextResponse.json({ error: "From value must be less than To value" }, { status: 400 })
    }

    // Check for overlapping ranges (excluding the current comment)
    const overlappingComments = await prisma.headTeacherComment.findMany({
      where: {
        schoolId,
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
    const updatedComment = await prisma.headTeacherComment.update({
      where: { id: params.id },
      data: {
        from,
        to,
        comment,
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Update head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while updating comment" }, { status: 500 })
  }
}

// Delete a head teacher comment
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

    // Check if comment exists
    const comment = await prisma.headTeacherComment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Delete comment
    await prisma.headTeacherComment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Delete head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting comment" }, { status: 500 })
  }
}
