import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get students for a specific teacher
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
        teachSclass: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get all students in the teacher's class
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

    return NextResponse.json(students)
  } catch (error) {
    console.error("Get teacher students error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching students" }, { status: 500 })
  }
}
