import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get a specific message
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

    const message = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if the user is either the sender or recipient
    if (message.senderId !== decoded.id && message.recipientId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to view this message" }, { status: 403 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Get message error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching message" }, { status: 500 })
  }
}

// Delete a message
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

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if the user is the sender
    if (message.senderId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to delete this message" }, { status: 403 })
    }

    // Delete message
    await prisma.message.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json({ error: "Something went wrong while deleting message" }, { status: 500 })
  }
}
