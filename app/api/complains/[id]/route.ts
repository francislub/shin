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

    const complain = await prisma.complain.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    })

    if (!complain) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    return NextResponse.json(complain)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if complaint exists and belongs to the user
    const complain = await prisma.complain.findUnique({
      where: { id: params.id },
    })

    if (!complain) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Only allow the student who created the complaint or an admin to update it
    if (decoded.role !== "Admin" && decoded.id !== complain.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { complaint, date } = body

    // Update complaint
    const updatedComplain = await prisma.complain.update({
      where: { id: params.id },
      data: {
        complaint,
        date: new Date(date),
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(updatedComplain)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if complaint exists
    const complain = await prisma.complain.findUnique({
      where: { id: params.id },
    })

    if (!complain) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Only allow the student who created the complaint or an admin to delete it
    if (decoded.role !== "Admin" && decoded.id !== complain.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
