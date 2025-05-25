import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get attendance records
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

    const url = new URL(req.url)
    const classId = url.searchParams.get("classId")
    const sclassId = url.searchParams.get("sclassId") || classId // Support both
    const date = url.searchParams.get("date")
    const teacherId = url.searchParams.get("teacherId")

    const whereClause: any = {}

    if (sclassId) whereClause.sclassId = sclassId
    if (date) whereClause.date = new Date(date)
    if (teacherId) whereClause.teacherId = teacherId

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error("Get attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching attendance" }, { status: 500 })
  }
}

// Create attendance records
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

    const { date, sclassId, teacherId, records } = await req.json()

    if (!date || !sclassId || !teacherId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create attendance records for each student
    const attendanceRecords = await Promise.all(
      records.map((record: any) =>
        prisma.attendanceRecord.create({
          data: {
            date: new Date(date),
            status: record.status,
            studentId: record.studentId,
            sclassId,
            teacherId,
            schoolId: decoded.id, // Assuming the token contains school ID
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNum: true,
              },
            },
          },
        }),
      ),
    )

    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error("Create attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while creating attendance" }, { status: 500 })
  }
}

// Update attendance records
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { date, sclassId, teacherId, records } = await req.json()

    if (!date || !sclassId || !teacherId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Delete existing records for this date, class, and teacher
    await prisma.attendanceRecord.deleteMany({
      where: {
        date: new Date(date),
        sclassId,
        teacherId,
      },
    })

    // Create new attendance records
    const attendanceRecords = await Promise.all(
      records.map((record: any) =>
        prisma.attendanceRecord.create({
          data: {
            date: new Date(date),
            status: record.status,
            studentId: record.studentId,
            sclassId,
            teacherId,
            schoolId: decoded.id,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNum: true,
              },
            },
          },
        }),
      ),
    )

    return NextResponse.json(attendanceRecords)
  } catch (error) {
    console.error("Update attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while updating attendance" }, { status: 500 })
  }
}
