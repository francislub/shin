import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all head teacher comments for a school
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const schoolId = req.nextUrl.searchParams.get("schoolId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const comments = await prisma.headTeacherComment.findMany({
      where: { schoolId },
      orderBy: { from: "asc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Get head teacher comments error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching comments" }, { status: 500 })
  }
}

// Create a new head teacher comment
export async function POST(req: NextRequest) {
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

    // Check for overlapping ranges
    const overlappingComments = await prisma.headTeacherComment.findMany({
      where: {
        schoolId,
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

    // Create new comment
    const newComment = await prisma.headTeacherComment.create({
      data: {
        from,
        to,
        comment,
        school: {
          connect: { id: schoolId },
        },
      },
    })

    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    console.error("Create head teacher comment error:", error)
    return NextResponse.json({ error: "Something went wrong while creating comment" }, { status: 500 })
  }
}
