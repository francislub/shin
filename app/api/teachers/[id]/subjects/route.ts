import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get subjects for a specific teacher
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

    // Get all subjects in the teacher's assigned class
    const subjects = await prisma.subject.findMany({
      where: {
        sclassId: teacher.teachSclassId,
      },
      include: {
        sclassName: {
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
    })

    // Get students for the class
    const students = await prisma.student.findMany({
      where: {
        sclassId: teacher.teachSclassId,
      },
      select: {
        id: true,
        name: true,
        rollNum: true,
        photo: true,
      },
    })

    // Transform the response to match frontend expectations
    const subjectsWithStudents = subjects.map((subject) => ({
      id: subject.id,
      subName: subject.subName,
      subCode: subject.subCode,
      sessions: Number.parseInt(subject.sessions) || 0,
      sclass: {
        id: subject.sclassName.id,
        sclassName: subject.sclassName.sclassName,
      },
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        rollNum: student.rollNum,
        email: "", // Not available in current schema
      })),
      isTeaching: subject.teacher?.id === teacher.id,
    }))

    return NextResponse.json(subjectsWithStudents)
  } catch (error) {
    console.error("Get teacher subjects error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher subjects" }, { status: 500 })
  }
}
