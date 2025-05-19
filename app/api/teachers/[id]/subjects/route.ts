import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get subjects for a specific teacher
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const whereClause: any = {
      teacherId: params.id,
    }

    if (classId) {
      whereClause.classId = classId
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    })

    // Get students for each subject
    const subjectsWithStudents = await Promise.all(
      subjects.map(async (subject) => {
        const students = await prisma.student.findMany({
          where: {
            classId: subject.classId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            photoUrl: true,
          },
        })

        return {
          ...subject,
          students,
        }
      }),
    )

    return NextResponse.json(subjectsWithStudents)
  } catch (error) {
    console.error("Get teacher subjects error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher subjects" }, { status: 500 })
  }
}
