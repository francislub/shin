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

    const { id } = params

    const term = await prisma.term.findUnique({
      where: { id },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    return NextResponse.json(term)
  } catch (error) {
    console.error("Get term error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching the term" }, { status: 500 })
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

    const { id } = params
    const body = await req.json()
    const { termName, nextTermStarts, nextTermEnds, year, status, schoolId } = body

    // Validate required fields
    if (!termName || !nextTermStarts || !nextTermEnds || !year || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if term exists
    const existingTerm = await prisma.term.findUnique({
      where: { id },
    })

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // If setting to active, update other terms to inactive
    if (status === "Active") {
      await prisma.term.updateMany({
        where: {
          schoolId,
          status: "Active",
          id: { not: id },
        },
        data: {
          status: "Inactive",
        },
      })
    }

    // Update term
    const updatedTerm = await prisma.term.update({
      where: { id },
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
    return NextResponse.json(
      {
        error: `Something went wrong while updating term: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
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

    const { id } = params

    // Check if term exists
    const existingTerm = await prisma.term.findUnique({
      where: { id },
    })

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Check if term is active
    if (existingTerm.status === "Active") {
      return NextResponse.json({ error: "Cannot delete an active term" }, { status: 400 })
    }

    // Check if term has associated classes
    const classesCount = await prisma.sclass.count({
      where: { termId: id },
    })

    if (classesCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete term with associated classes. Please reassign classes first." },
        { status: 400 },
      )
    }

    // Delete term
    await prisma.term.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Term deleted successfully" })
  } catch (error) {
    console.error("Delete term error:", error)
    return NextResponse.json(
      {
        error: `Something went wrong while deleting term: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
