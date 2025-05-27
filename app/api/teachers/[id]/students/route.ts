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
        teachSclass: true,
        teachSubject: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (!teacher.teachSclass) {
      return NextResponse.json([]) // Return empty array if no class assigned
    }

    // Get all students in the teacher's assigned class with complete data
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
        examResult: {
          include: {
            subject: {
              select: {
                id: true,
                subName: true,
                subCode: true,
              },
            },
          },
        },
      },
      orderBy: {
        rollNum: "asc",
      },
    })

    // Transform the response to include subjects from exam results
    const studentsWithDetails = students.map((student) => {
      // Get unique subjects from exam results
      const subjects = student.examResult
        .map((result) => result.subject)
        .filter((subject, index, self) => index === self.findIndex((s) => s.id === subject.id))

      return {
        id: student.id,
        name: student.name,
        rollNum: student.rollNum,
        email: student.email,
        gender: student.gender,
        photo: student.photo,
        sclass: student.sclass,
        parent: student.parent,
        subjects: subjects,
      }
    })

    return NextResponse.json(studentsWithDetails)
  } catch (error) {
    console.error("Get teacher students error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher students" }, { status: 500 })
  }
}
