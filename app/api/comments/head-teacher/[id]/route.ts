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
      return NextResponse.json({ error: "Head teacher comment not found" }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Get head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching head teacher comment" }, { status: 500 })
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

    // Check for overlapping comment ranges (excluding the current comment)
    const overlappingComment = await prisma.headTeacherComment.findFirst({
      where: {
        id: { not: params.id },
        schoolId,
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
      return NextResponse.json({ error: "Comment range overlaps with an existing comment" }, { status: 400 })
    }

    // Update head teacher comment
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
    return NextResponse.json({ error: "Something went wrong while updating head teacher comment" }, { status: 500 })
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
      return NextResponse.json({ error: "Head teacher comment not found" }, { status: 404 })
    }

    // Delete head teacher comment
    await prisma.headTeacherComment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Head teacher comment deleted successfully" })
  } catch (error) {
    console.error("Delete head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting head teacher comment" }, { status: 500 })
  }
}
