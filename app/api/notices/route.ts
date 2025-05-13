import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all notices for a school
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

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const notices = await prisma.notice.findMany({
      where: { schoolId },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error("Get notices error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching notices" }, { status: 500 })
  }
}

// Create a new notice
export async function POST(req: NextRequest) {
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
    const { title, details, date, schoolId } = body

    // Create new notice
    const newNotice = await prisma.notice.create({
      data: {
        title,
        details,
        date: new Date(date),
        school: {
          connect: { id: schoolId },
        },
      },
    })

    return NextResponse.json(newNotice, { status: 201 })
  } catch (error) {
    console.error("Create notice error:", error)
    return NextResponse.json({ error: "Something went wrong while creating notice" }, { status: 500 })
  }
}
