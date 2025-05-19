import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get dashboard statistics for a specific teacher
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
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    const classIds = teacherClasses.map((cls) => cls.id)

    // Get subjects taught by the teacher
    const teacherSubjects = await prisma.subject.findMany({
      where: {
        teacherId: params.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        classId: true,
      },
    })

    // Get total number of students in teacher's classes
    const totalStudents = await prisma.student.count({
      where: {
        classId: {
          in: classIds,
        },
      },
    })

    // Get upcoming exams for teacher's classes
    const today = new Date()
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(today.getDate() + 30)

    const upcomingExams = await prisma.exam.findMany({
      where: {
        classId: {
          in: classIds,
        },
        date: {
          gte: today,
          lte: thirtyDaysLater,
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        examType: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 5,
    })

    // Get recent attendance records
    const recentAttendance = await prisma.attendance.groupBy({
      by: ["date", "classId", "subjectId"],
      where: {
        teacherId: params.id,
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    })

    // Fetch additional details for attendance records
    const attendanceDetails = await Promise.all(
      recentAttendance.map(async (record) => {
        const cls = await prisma.class.findUnique({
          where: { id: record.classId },
          select: { name: true },
        })

        const subject = await prisma.subject.findUnique({
          where: { id: record.subjectId },
          select: { name: true },
        })

        const presentCount = await prisma.attendance.count({
          where: {
            date: record.date,
            classId: record.classId,
            subjectId: record.subjectId,
            status: "present",
          },
        })

        const absentCount = await prisma.attendance.count({
          where: {
            date: record.date,
            classId: record.classId,
            subjectId: record.subjectId,
            status: "absent",
          },
        })

        const lateCount = await prisma.attendance.count({
          where: {
            date: record.date,
            classId: record.classId,
            subjectId: record.subjectId,
            status: "late",
          },
        })

        const totalStudents = presentCount + absentCount + lateCount

        return {
          id: `${record.date.toISOString()}-${record.classId}-${record.subjectId}`,
          date: record.date,
          className: cls?.name || "Unknown Class",
          subjectName: subject?.name || "Unknown Subject",
          presentCount,
          absentCount,
          lateCount,
          totalStudents,
        }
      }),
    )

    // Format classes for response
    const classesTeaching = teacherClasses.map((cls) => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      studentCount: cls._count.students,
    }))

    // Format exams for response
    const formattedExams = upcomingExams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      date: exam.date.toISOString(),
      type: exam.examType,
    }))

    const dashboardStats = {
      totalClasses: teacherClasses.length,
      totalSubjects: teacherSubjects.length,
      totalStudents,
      upcomingExams: formattedExams,
      recentAttendance: attendanceDetails,
      classesTeaching,
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("Get teacher dashboard stats error:", error)
    return NextResponse.json(
      { error: "Something went wrong while fetching teacher dashboard statistics" },
      { status: 500 },
    )
  }
}
