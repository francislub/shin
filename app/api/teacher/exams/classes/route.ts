import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher details first
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        teachSclassId: true,
        teachSubject: {
          select: {
            id: true,
            sclassId: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get classes where teacher is assigned (either as class teacher or subject teacher)
    const classIds = new Set<string>()

    // Add class if teacher is a class teacher
    if (teacher.teachSclassId) {
      classIds.add(teacher.teachSclassId)
    }

    // Add classes from subjects taught
    if (teacher.teachSubject) {
      teacher.teachSubject.forEach((subject) => {
        if (subject.sclassId) {
          classIds.add(subject.sclassId)
        }
      })
    }

    if (classIds.size === 0) {
      return NextResponse.json([])
    }

    // Fetch the actual class details
    const classes = await prisma.sclass.findMany({
      where: {
        id: {
          in: Array.from(classIds),
        },
      },
      select: {
        id: true,
        sclassName: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        sclassName: "asc",
      },
    })

    // Transform the data to match the expected format
    const transformedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.sclassName,
      section: "", // You might want to add section field to your schema
      _count: cls._count,
    }))

    return NextResponse.json(transformedClasses)
  } catch (error) {
    console.error("Error fetching teacher classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
