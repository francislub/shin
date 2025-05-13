import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific term
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

    const term = await prisma.term.findUnique({
      where: { id: params.id },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    return NextResponse.json(term)
  } catch (error) {
    console.error("Get term error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching term" }, { status: 500 })
  }
}

// Update a term
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
    const { termName, nextTermStarts, nextTermEnds, year, status, schoolId } = body

    // If updating to active status, make all other terms inactive
    if (status === "Active") {
      await prisma.term.updateMany({
        where: {
          schoolId,
          id: { not: params.id },
        },
        data: {
          status: "Inactive",
        },
      })
    }

    // Update term
    const updatedTerm = await prisma.term.update({
      where: { id: params.id },
      data: {
        termName,
        nextTermStarts,
        nextTermEnds,
        year,
        status,
      },
    })

    return NextResponse.json(updatedTerm)
  } catch (error) {
    console.error("Update term error:", error)
    return NextResponse.json({ error: "Something went wrong while updating term" }, { status: 500 })
  }
}

// Delete a term
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

    // Check if term exists
    const term = await prisma.term.findUnique({
      where: { id: params.id },
      include: {
        sclasses: true,
      },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Check if term has associated classes
    if (term.sclasses.length > 0) {
      return NextResponse.json({ error: "Cannot delete term with associated classes" }, { status: 400 })
    }

    // Delete term
    await prisma.term.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Term deleted successfully" })
  } catch (error) {
    console.error("Delete term error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting term" }, { status: 500 })
  }
}
