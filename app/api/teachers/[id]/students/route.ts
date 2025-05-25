import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get students for a specific teacher's class
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get teacher details first
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        teachSclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get all students in the teacher's assigned class
    const students = await prisma.student.findMany({
      where: {
        sclassId: teacher.teachSclassId,
      },
      include: {
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        rollNum: "asc",
      },
    })

    // Transform the response
    const studentsData = students.map((student) => ({
      id: student.id,
      name: student.name,
      rollNum: student.rollNum,
      gender: student.gender,
      photo: student.photo,
      class: {
        id: student.sclass.id,
        name: student.sclass.sclassName,
      },
      parent: student.parent
        ? {
            id: student.parent.id,
            name: student.parent.name,
            email: student.parent.email,
            phone: student.parent.phone,
          }
        : null,
      discipline: student.discipline,
      timeManagement: student.timeManagement,
      smartness: student.smartness,
      attendanceRemarks: student.attendanceRemarks,
    }))

    return NextResponse.json(studentsData)
  } catch (error) {
    console.error("Get teacher students error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching students" }, { status: 500 })
  }
}
