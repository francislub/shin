import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get classes for a specific teacher
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

    // Get teacher details
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        teachSclass: {
          include: {
            students: {
              select: {
                id: true,
                name: true,
                rollNum: true,
              },
            },
            subjects: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        teachSubject: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Format the class data
    const classData = {
      id: teacher.teachSclass.id,
      sclassName: teacher.teachSclass.sclassName,
      isClassTeacher: true, // This teacher is the class teacher
      studentCount: teacher.teachSclass.students.length,
      subjects: teacher.teachSclass.subjects.map((subject) => ({
        id: subject.id,
        subName: subject.subName,
        subCode: subject.subCode,
        isTeaching: subject.teacher?.id === teacher.id,
        teacherName: subject.teacher?.name || "Unassigned",
      })),
      students: teacher.teachSclass.students,
    }

    return NextResponse.json([classData]) // Return as array for consistency
  } catch (error) {
    console.error("Get teacher classes error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher classes" }, { status: 500 })
  }
}
