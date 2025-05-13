import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all gradings for a school
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

    const gradings = await prisma.grading.findMany({
      where: { schoolId },
      orderBy: { from: "desc" },
    })

    return NextResponse.json(gradings)
  } catch (error) {
    console.error("Get gradings error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching gradings" }, { status: 500 })
  }
}

// Create a new grading
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
    const { from, to, grade, comment, schoolId } = body

    // Check for overlapping grade ranges
    const overlappingGrade = await prisma.grading.findFirst({
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

    if (overlappingGrade) {
      return NextResponse.json({ error: "Grade range overlaps with an existing grade" }, { status: 400 })
    }

    // Create new grading
    const newGrading = await prisma.grading.create({
      data: {
        from,
        to,
        grade,
        comment,
        school: {
          connect: { id: schoolId },
        },
      },
    })

    return NextResponse.json(newGrading, { status: 201 })
  } catch (error) {
    console.error("Create grading error:", error)
    return NextResponse.json({ error: "Something went wrong while creating grading" }, { status: 500 })
  }
}
