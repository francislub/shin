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

    const classId = req.nextUrl.searchParams.get("classId")
    const subjectId = req.nextUrl.searchParams.get("subjectId")
    const date = req.nextUrl.searchParams.get("date")
    const studentId = req.nextUrl.searchParams.get("studentId")
    const teacherId = req.nextUrl.searchParams.get("teacherId")

    const whereClause: any = {}

    if (classId) {
      whereClause.classId = classId
    }

    if (subjectId) {
      whereClause.subjectId = subjectId
    }

    if (date) {
      whereClause.date = new Date(date)
    }

    if (studentId) {
      whereClause.studentId = studentId
    }

    if (teacherId) {
      whereClause.teacherId = teacherId
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Get attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching attendance" }, { status: 500 })
  }
}

// Create new attendance records
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { classId, subjectId, date, teacherId, attendanceRecords } = body

    if (!classId || !subjectId || !date || !teacherId || !attendanceRecords) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create attendance records for each student
    const createdRecords = await Promise.all(
      attendanceRecords.map(async (record: { studentId: string; status: string }) => {
        return prisma.attendance.create({
          data: {
            date: new Date(date),
            status: record.status,
            class: { connect: { id: classId } },
            subject: { connect: { id: subjectId } },
            teacher: { connect: { id: teacherId } },
            student: { connect: { id: record.studentId } },
          },
        })
      }),
    )

    return NextResponse.json(createdRecords, { status: 201 })
  } catch (error) {
    console.error("Create attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while creating attendance records" }, { status: 500 })
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

    if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { classId, subjectId, date, attendanceRecords } = body

    if (!classId || !subjectId || !date || !attendanceRecords) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, delete existing records for this class, subject, and date
    await prisma.attendance.deleteMany({
      where: {
        classId,
        subjectId,
        date: new Date(date),
      },
    })

    // Then create new records
    const updatedRecords = await Promise.all(
      attendanceRecords.map(async (record: { studentId: string; status: string }) => {
        return prisma.attendance.create({
          data: {
            date: new Date(date),
            status: record.status,
            class: { connect: { id: classId } },
            subject: { connect: { id: subjectId } },
            teacher: { connect: { id: decoded.id } },
            student: { connect: { id: record.studentId } },
          },
        })
      }),
    )

    return NextResponse.json(updatedRecords)
  } catch (error) {
    console.error("Update attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while updating attendance records" }, { status: 500 })
  }
}
