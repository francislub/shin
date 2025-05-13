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
      orderBy: { from: "desc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Get head teacher comments error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching head teacher comments" }, { status: 500 })
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

    // Check for overlapping comment ranges
    const overlappingComment = await prisma.headTeacherComment.findFirst({
      where: {
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

    // Create new head teacher comment
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
    return NextResponse.json({ error: "Something went wrong while creating head teacher comment" }, { status: 500 })
  }
}
