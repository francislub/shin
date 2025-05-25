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
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    if (!teacher.teachSclass) {
      return NextResponse.json([]) // Return empty array if no class assigned
    }

    // Get all students in the teacher's assigned class
    const students = await prisma.student.findMany({
      where: {
        sclassId: teacher.teachSclassId,
      },
      select: {
        id: true,
        name: true,
        rollNum: true,
        photo: true,
        gender: true,
      },
    })

    // Transform the response to match frontend expectations
    const studentsWithDetails = students.map((student) => ({
      id: student.id,
      firstName: student.name.split(" ")[0] || student.name, // Split name for firstName
      lastName: student.name.split(" ").slice(1).join(" ") || "", // Split name for lastName
      name: student.name,
      admissionNumber: student.rollNum, // Map rollNum to admissionNumber
      rollNum: student.rollNum,
      photoUrl: student.photo,
      photo: student.photo,
      gender: student.gender,
    }))

    return NextResponse.json(studentsWithDetails)
  } catch (error) {
    console.error("Get teacher students error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher students" }, { status: 500 })
  }
}
