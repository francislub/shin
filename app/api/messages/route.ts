import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get messages for a user (either as sender or recipient)
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

    const senderId = req.nextUrl.searchParams.get("senderId")
    const recipientId = req.nextUrl.searchParams.get("recipientId")
    const schoolId = req.nextUrl.searchParams.get("schoolId")

    if (!senderId && !recipientId && !schoolId) {
      return NextResponse.json({ error: "At least one filter parameter is required" }, { status: 400 })
    }

    const whereClause: any = {}

    if (senderId) {
      whereClause.senderId = senderId
    }

    if (recipientId) {
      whereClause.recipientId = recipientId
    }

    if (schoolId) {
      whereClause.schoolId = schoolId
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching messages" }, { status: 500 })
  }
}

// Create a new message
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { subject, content, senderId, senderName, senderType, recipientId, recipientName, recipientType, schoolId } =
      body

    if (!subject || !content || !senderId || !recipientId || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new message
    const newMessage = await prisma.message.create({
      data: {
        subject,
        content,
        senderId,
        senderName,
        senderType,
        recipientId,
        recipientName,
        recipientType,
        read: false,
        schoolId,
      },
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json({ error: "Something went wrong while creating message" }, { status: 500 })
  }
}
