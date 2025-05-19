import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get teacher profile
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

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        qualification: true,
        experience: true,
        joinDate: true,
        photoUrl: true,
        subjects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get classes where the teacher is assigned as a subject teacher or class teacher
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { classTeacherId: params.id },
          {
            subjects: {
              some: {
                teacherId: params.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        section: true,
        classTeacherId: true,
      },
    })

    // Format classes to include isClassTeacher flag
    const classes = teacherClasses.map((cls) => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      isClassTeacher: cls.classTeacherId === params.id,
    }))

    return NextResponse.json({
      ...teacher,
      classes,
    })
  } catch (error) {
    console.error("Get teacher profile error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher profile" }, { status: 500 })
  }
}

// Update teacher profile
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || (decoded.id !== params.id && decoded.role !== "Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, address } = body

    // Check if email is already in use by another teacher
    if (email) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })

      if (existingTeacher) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        qualification: true,
        experience: true,
        joinDate: true,
        photoUrl: true,
        subjects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Get classes where the teacher is assigned as a subject teacher or class teacher
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { classTeacherId: params.id },
          {
            subjects: {
              some: {
                teacherId: params.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        section: true,
        classTeacherId: true,
      },
    })

    // Format classes to include isClassTeacher flag
    const classes = teacherClasses.map((cls) => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      isClassTeacher: cls.classTeacherId === params.id,
    }))

    return NextResponse.json({
      ...updatedTeacher,
      classes,
    })
  } catch (error) {
    console.error("Update teacher profile error:", error)
    return NextResponse.json({ error: "Something went wrong while updating teacher profile" }, { status: 500 })
  }
}
