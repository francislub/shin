import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific notice
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

    const notice = await prisma.notice.findUnique({
      where: { id: params.id },
    })

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 })
    }

    return NextResponse.json(notice)
  } catch (error) {
    console.error("Get notice error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching notice" }, { status: 500 })
  }
}

// Update a notice
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
    const { title, details, date } = body

    // Update notice
    const updatedNotice = await prisma.notice.update({
      where: { id: params.id },
      data: {
        title,
        details,
        date: new Date(date),
      },
    })

    return NextResponse.json(updatedNotice)
  } catch (error) {
    console.error("Update notice error:", error)
    return NextResponse.json({ error: "Something went wrong while updating notice" }, { status: 500 })
  }
}

// Delete a notice
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

    // Check if notice exists
    const notice = await prisma.notice.findUnique({
      where: { id: params.id },
    })

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 })
    }

    // Delete notice
    await prisma.notice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Notice deleted successfully" })
  } catch (error) {
    console.error("Delete notice error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting notice" }, { status: 500 })
  }
}
