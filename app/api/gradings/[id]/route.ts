import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific grading
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

    const grading = await prisma.grading.findUnique({
      where: { id: params.id },
    })

    if (!grading) {
      return NextResponse.json({ error: "Grading not found" }, { status: 404 })
    }

    return NextResponse.json(grading)
  } catch (error) {
    console.error("Get grading error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching grading" }, { status: 500 })
  }
}

// Update a grading
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
    const { from, to, grade, comment, schoolId } = body

    // Validate input
    if (from >= to) {
      return NextResponse.json({ error: "From value must be less than To value" }, { status: 400 })
    }

    // Check for overlapping ranges (excluding the current grading)
    const overlappingGradings = await prisma.grading.findMany({
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

    if (overlappingGradings.length > 0) {
      return NextResponse.json({ error: "Grading range overlaps with existing ranges" }, { status: 400 })
    }

    // Update grading
    const updatedGrading = await prisma.grading.update({
      where: { id: params.id },
      data: {
        from,
        to,
        grade,
        comment,
      },
    })

    return NextResponse.json(updatedGrading)
  } catch (error) {
    console.error("Update grading error:", error)
    return NextResponse.json({ error: "Something went wrong while updating grading" }, { status: 500 })
  }
}

// Delete a grading
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

    // Check if grading exists
    const grading = await prisma.grading.findUnique({
      where: { id: params.id },
    })

    if (!grading) {
      return NextResponse.json({ error: "Grading not found" }, { status: 404 })
    }

    // Delete grading
    await prisma.grading.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Grading deleted successfully" })
  } catch (error) {
    console.error("Delete grading error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting grading" }, { status: 500 })
  }
}
