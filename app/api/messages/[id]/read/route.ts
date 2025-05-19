import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Mark a message as read
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

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if the user is the recipient
    if (message.recipientId !== decoded.id) {
      return NextResponse.json({ error: "Unauthorized to mark this message as read" }, { status: 403 })
    }

    // Mark message as read
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: { read: true },
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error("Mark message as read error:", error)
    return NextResponse.json({ error: "Something went wrong while marking message as read" }, { status: 500 })
  }
}
