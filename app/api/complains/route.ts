import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all complaints for a school or student
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
    const userId = req.nextUrl.searchParams.get("userId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const whereClause: any = { schoolId }

    if (userId) {
      whereClause.userId = userId
    }

    const complains = await prisma.complain.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(complains)
  } catch (error) {
    console.error("Get complaints error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching complaints" }, { status: 500 })
  }
}

// Create a new complaint
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { complaint, date, userId, schoolId } = body

    // Create new complaint
    const newComplain = await prisma.complain.create({
      data: {
        complaint,
        date: new Date(date),
        user: {
          connect: { id: userId },
        },
        school: {
          connect: { id: schoolId },
        },
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(newComplain, { status: 201 })
  } catch (error) {
    console.error("Create complaint error:", error)
    return NextResponse.json({ error: "Something went wrong while creating complaint" }, { status: 500 })
  }
}
