import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sclassId = searchParams.get("sclassId")
    const studentId = searchParams.get("studentId")
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      schoolId: decoded.id,
    }

    if (sclassId) where.sclassId = sclassId
    if (studentId) where.studentId = studentId
    if (date) {
      where.date = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      }
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where,
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
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { attendanceData } = body // Array of attendance records

    const records = await Promise.all(
      attendanceData.map(async (record: any) => {
        return prisma.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: new Date(record.date),
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks,
          },
          create: {
            date: new Date(record.date),
            status: record.status,
            remarks: record.remarks,
            studentId: record.studentId,
            sclassId: record.sclassId,
            teacherId: record.teacherId,
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
            sclass: {
              select: {
                id: true,
                sclassName: true,
              },
            },
          },
        })
      }),
    )

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error creating attendance records:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
