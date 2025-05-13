import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get attendance for a student or class
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

    const studentId = req.nextUrl.searchParams.get("studentId")
    const sclassId = req.nextUrl.searchParams.get("sclassId")
    const subjectId = req.nextUrl.searchParams.get("subjectId")
    const date = req.nextUrl.searchParams.get("date")

    if (!studentId && !sclassId) {
      return NextResponse.json({ error: "Student ID or Class ID is required" }, { status: 400 })
    }

    // Query parameters for filtering
    const whereClause: any = {}

    if (studentId) {
      whereClause.id = studentId
    }

    if (sclassId) {
      whereClause.sclassId = sclassId
    }

    // Get students with attendance data
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        rollNum: true,
        attendance: true,
      },
    })

    // Filter attendance data if needed
    const result = students.map((student) => {
      let filteredAttendance = student.attendance || []

      if (date) {
        const targetDate = new Date(date)
        filteredAttendance = filteredAttendance.filter((a) => {
          const attendanceDate = new Date(a.date)
          return attendanceDate.toDateString() === targetDate.toDateString()
        })
      }

      if (subjectId) {
        filteredAttendance = filteredAttendance.filter((a) => a.subName === subjectId)
      }

      return {
        ...student,
        attendance: filteredAttendance,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching attendance" }, { status: 500 })
  }
}

// Mark attendance for students
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
    const { date, subjectId, attendanceData } = body

    if (!date || !subjectId || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ error: "Invalid attendance data" }, { status: 400 })
    }

    const attendanceDate = new Date(date)
    const results = []

    // Process each student's attendance
    for (const item of attendanceData) {
      const { studentId, status } = item

      if (!studentId || !status) {
        continue
      }

      // Get the student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { attendance: true },
      })

      if (!student) {
        continue
      }

      // Filter out any existing attendance for this date and subject
      const updatedAttendance = (student.attendance || []).filter((a) => {
        const aDate = new Date(a.date)
        return !(aDate.toDateString() === attendanceDate.toDateString() && a.subName === subjectId)
      })

      // Add the new attendance record
      updatedAttendance.push({
        date: attendanceDate,
        status,
        subName: subjectId,
      })

      // Update the student's attendance
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { attendance: updatedAttendance },
        select: { id: true, name: true, rollNum: true },
      })

      results.push({
        ...updatedStudent,
        status,
      })
    }

    return NextResponse.json({
      message: "Attendance marked successfully",
      date: attendanceDate,
      subject: subjectId,
      students: results,
    })
  } catch (error) {
    console.error("Mark attendance error:", error)
    return NextResponse.json({ error: "Something went wrong while marking attendance" }, { status: 500 })
  }
}
