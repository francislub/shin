import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific complaint
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

    const complaint = await prisma.complain.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            className: true,
          },
        },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // If student is making the request, they can only view their own complaints
    if (decoded.role === "Student" && complaint.userId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to view this complaint" }, { status: 403 })
    }

    return NextResponse.json(complaint)
  } catch (error) {
    console.error("Get complaint error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching complaint" }, { status: 500 })
  }
}

// Update a complaint
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get the existing complaint
    const existingComplaint = await prisma.complain.findUnique({
      where: { id: params.id },
    })

    if (!existingComplaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // If student is making the request, they can only update their own complaints
    if (decoded.role === "Student" && existingComplaint.userId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to update this complaint" }, { status: 403 })
    }

    const body = await req.json()
    const { date, complaint } = body

    // Update complaint
    const updatedComplaint = await prisma.complain.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
        complaint,
      },
    })

    return NextResponse.json(updatedComplaint)
  } catch (error) {
    console.error("Update complaint error:", error)
    return NextResponse.json({ error: "Something went wrong while updating complaint" }, { status: 500 })
  }
}

// Delete a complaint
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get the existing complaint
    const existingComplaint = await prisma.complain.findUnique({
      where: { id: params.id },
    })

    if (!existingComplaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // If student is making the request, they can only delete their own complaints
    if (decoded.role === "Student" && existingComplaint.userId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to delete this complaint" }, { status: 403 })
    }

    // Delete complaint
    await prisma.complain.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Complaint deleted successfully" })
  } catch (error) {
    console.error("Delete complaint error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting complaint" }, { status: 500 })
  }
}
