import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get dashboard statistics for a specific teacher
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if prisma is available
    if (!prisma) {
      console.error("Prisma client is not available")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify teacher exists and get their assignments
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        teachSclassId: true,
        teachSubjectId: true,
        schoolId: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Initialize default values
    let teacherClass = null
    let teacherSubject = null
    let totalStudents = 0
    const classesTeaching: any[] = []

    // Get the class where teacher is assigned as class teacher (if any)
    if (teacher.teachSclassId) {
      teacherClass = await prisma.sclass.findUnique({
        where: { id: teacher.teachSclassId },
        select: {
          id: true,
          sclassName: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      })

      if (teacherClass) {
        totalStudents = teacherClass._count.students
        classesTeaching.push({
          id: teacherClass.id,
          name: teacherClass.sclassName,
          section: "", // No section field in schema
          studentCount: teacherClass._count.students,
        })
      }
    }

    // Get subject taught by the teacher (if any)
    if (teacher.teachSubjectId) {
      teacherSubject = await prisma.subject.findUnique({
        where: { id: teacher.teachSubjectId },
        select: {
          id: true,
          subName: true,
          subCode: true,
          sclassId: true,
          sclassName: {
            select: {
              sclassName: true,
            },
          },
        },
      })
    }

    // Get all classes where this teacher teaches subjects (alternative approach)
    const subjectsTeaching = await prisma.subject.findMany({
      where: {
        teacher: {
          id: id,
        },
      },
      select: {
        id: true,
        subName: true,
        subCode: true,
        sclassId: true,
        sclassName: {
          select: {
            id: true,
            sclassName: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    })

    // Add classes from subjects teaching if not already included
    subjectsTeaching.forEach((subject) => {
      if (subject.sclassName && !classesTeaching.find((c) => c.id === subject.sclassName.id)) {
        classesTeaching.push({
          id: subject.sclassName.id,
          name: subject.sclassName.sclassName,
          section: "",
          studentCount: subject.sclassName._count.students,
        })
        totalStudents += subject.sclassName._count.students
      }
    })

    // Get class IDs for queries
    const classIds = classesTeaching.map((c) => c.id)

    // Get upcoming exams for teacher's classes
    const today = new Date()
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(today.getDate() + 30)

    const upcomingExams = await prisma.exam.findMany({
      where: {
        AND: [
          {
            OR: [{ sclassId: { in: classIds } }, { teacherId: id }],
          },
          {
            startDate: {
              gte: today,
              lte: thirtyDaysLater,
            },
          },
        ],
      },
      include: {
        sclass: {
          select: {
            sclassName: true,
          },
        },
        subject: {
          select: {
            subName: true,
            subCode: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
      take: 5,
    })

    // Get recent attendance records (last 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const recentAttendanceData = await prisma.attendanceRecord.groupBy({
      by: ["date", "sclassId"],
      where: {
        teacherId: id,
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    })

    // Fetch detailed attendance information
    const attendanceDetails = await Promise.all(
      recentAttendanceData.map(async (record) => {
        const sclass = await prisma.sclass.findUnique({
          where: { id: record.sclassId },
          select: { sclassName: true },
        })

        const attendanceCounts = await prisma.attendanceRecord.groupBy({
          by: ["status"],
          where: {
            date: record.date,
            sclassId: record.sclassId,
            teacherId: id,
          },
          _count: {
            status: true,
          },
        })

        const statusCounts = attendanceCounts.reduce(
          (acc, item) => {
            acc[item.status.toLowerCase()] = item._count.status
            return acc
          },
          {} as Record<string, number>,
        )

        const presentCount = statusCounts.present || 0
        const absentCount = statusCounts.absent || 0
        const lateCount = statusCounts.late || 0
        const totalStudentsInClass = presentCount + absentCount + lateCount

        return {
          id: `${record.date.toISOString()}-${record.sclassId}`,
          date: record.date,
          className: sclass?.sclassName || "Unknown Class",
          subjectName: teacherSubject?.subName || "General",
          presentCount,
          absentCount,
          lateCount,
          totalStudents: totalStudentsInClass,
        }
      }),
    )

    // Format exams for response
    const formattedExams = upcomingExams.map((exam) => ({
      id: exam.id,
      name: exam.examName,
      date: exam.startDate.toISOString(),
      type: exam.examType,
      className: exam.sclass?.sclassName || "Unknown Class",
      subjectName: exam.subject ? `${exam.subject.subName} (${exam.subject.subCode})` : "Unknown Subject",
    }))

    const dashboardStats = {
      totalClasses: classesTeaching.length,
      totalSubjects: subjectsTeaching.length,
      totalStudents,
      upcomingExams: formattedExams,
      recentAttendance: attendanceDetails,
      classesTeaching,
      teacherInfo: {
        id: teacher.id,
        name: teacher.name,
      },
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
