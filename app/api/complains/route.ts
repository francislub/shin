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
    const studentId = req.nextUrl.searchParams.get("studentId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const whereClause: any = { schoolId }
    if (studentId) {
      whereClause.userId = studentId
    }

    // If student is making the request, only show their complaints
    if (decoded.role === "Student") {
      whereClause.userId = decoded.id
    }

    const complaints = await prisma.complain.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
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

    return NextResponse.json(complaints)
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { date, complaint, userId, schoolId } = body

    // If student is making the request, they can only create complaints for themselves
    if (decoded.role === "Student" && decoded.id !== userId) {
      return NextResponse.json({ error: "Unauthorized to create complaint for another student" }, { status: 403 })
    }

    // Create new complaint
    const newComplaint = await prisma.complain.create({
      data: {
        date: new Date(date),
        complaint,
        user: {
          connect: { id: userId },
        },
        school: {
          connect: { id: schoolId },
        },
      },
    })

    return NextResponse.json(newComplaint, { status: 201 })
  } catch (error) {
    console.error("Create complaint error:", error)
    return NextResponse.json({ error: "Something went wrong while creating complaint" }, { status: 500 })
  }
}
