import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get classes for a specific teacher
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

    // Get classes where the teacher is assigned as a subject teacher
    const teacherSubjects = await prisma.subject.findMany({
      where: {
        teacherId: params.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            academicYear: true,
          },
        },
      },
    })

    // Get classes where the teacher is assigned as a class teacher
    const classTeacherClasses = await prisma.class.findMany({
      where: {
        classTeacherId: params.id,
      },
      select: {
        id: true,
        name: true,
        section: true,
        academicYear: true,
      },
    })

    // Combine and deduplicate classes
    const classesMap = new Map()

    // Add classes from subjects
    teacherSubjects.forEach((subject) => {
      if (subject.class && !classesMap.has(subject.class.id)) {
        classesMap.set(subject.class.id, {
          ...subject.class,
          isClassTeacher: false,
          subjects: [{ id: subject.id, name: subject.name, code: subject.code }],
        })
      } else if (subject.class) {
        const existingClass = classesMap.get(subject.class.id)
        existingClass.subjects.push({ id: subject.id, name: subject.name, code: subject.code })
      }
    })

    // Add or update classes where teacher is class teacher
    classTeacherClasses.forEach((cls) => {
      if (!classesMap.has(cls.id)) {
        classesMap.set(cls.id, {
          ...cls,
          isClassTeacher: true,
          subjects: [],
        })
      } else {
        const existingClass = classesMap.get(cls.id)
        existingClass.isClassTeacher = true
      }
    })

    // Get student counts for each class
    const classes = Array.from(classesMap.values())

    for (const cls of classes) {
      const studentCount = await prisma.student.count({
        where: {
          classId: cls.id,
        },
      })
      cls.studentCount = studentCount
    }

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Get teacher classes error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teacher classes" }, { status: 500 })
  }
}
