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
      orderBy: { from: "asc" },
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

    // Validate input
    if (from >= to) {
      return NextResponse.json({ error: "From value must be less than To value" }, { status: 400 })
    }

    // Check for overlapping ranges
    const overlappingGradings = await prisma.grading.findMany({
      where: {
        schoolId,
        OR: [
          { AND: [{ from: { lte: from } }, { to: { gte: from } }] },
          { AND: [{ from: { lte: to } }, { to: { gte: to } }] },
          { AND: [{ from: { gte: from } }, { to: { lte: to } }] },
        ],
      },
    })

    if (overlappingGradings.length > 0) {
      return NextResponse.json({ error: "Grading range overlaps with existing ranges" }, { status: 400 })
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
