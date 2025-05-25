import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sclassId = searchParams.get("sclassId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      schoolId: session.id,
    }

    if (sclassId) where.sclassId = sclassId
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get attendance summary by student
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
      },
    })

    // Group by student and calculate percentages
    const summary = attendanceRecords.reduce((acc: any, record) => {
      const studentId = record.student.id
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.student,
          sclass: record.sclass,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          percentage: 0,
        }
      }

      acc[studentId].totalDays++
      if (record.status === "Present") {
        acc[studentId].presentDays++
      } else if (record.status === "Absent") {
        acc[studentId].absentDays++
      } else if (record.status === "Late") {
        acc[studentId].lateDays++
        acc[studentId].presentDays++ // Count late as present for percentage
      }

      acc[studentId].percentage = (acc[studentId].presentDays / acc[studentId].totalDays) * 100

      return acc
    }, {})

    return NextResponse.json(Object.values(summary))
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
