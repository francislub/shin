import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher details with related data
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      include: {
        teachSclass: {
          include: {
            students: {
              select: {
                id: true,
                name: true,
                rollNum: true,
              },
            },
            subjects: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        teachSubject: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get all exams for subjects in teacher's class or their specific subject
    const examWhereClause: any = {
      OR: [
        { sclassId: teacher.teachSclassId }, // All exams in teacher's class
      ],
    }

    if (teacher.teachSubject) {
      examWhereClause.OR.push({ subjectId: teacher.teachSubject.id }) // Exams for teacher's specific subject
    }

    const recentExams = await prisma.exam.findMany({
      where: examWhereClause,
      include: {
        subject: {
          select: {
            id: true,
            subName: true,
          },
        },
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
      take: 5,
    })

    // Get recent attendance records for teacher's class
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: {
        sclassId: teacher.teachSclassId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    })

    // Get attendance statistics for teacher's class
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const monthlyAttendance = await prisma.attendanceRecord.findMany({
      where: {
        sclassId: teacher.teachSclassId,
        date: {
          gte: startOfMonth,
          lte: today,
        },
      },
    })

    const attendanceStats = {
      totalRecords: monthlyAttendance.length,
      presentCount: monthlyAttendance.filter((record) => record.status === "Present").length,
      absentCount: monthlyAttendance.filter((record) => record.status === "Absent").length,
      lateCount: monthlyAttendance.filter((record) => record.status === "Late").length,
    }

    // Get exam statistics
    const examStats = {
      totalExams: recentExams.length,
      upcomingExams: recentExams.filter((exam) => new Date(exam.startDate) > today).length,
      completedExams: recentExams.filter((exam) => new Date(exam.endDate) < today).length,
    }

    // Get class performance summary
    const classPerformance = await Promise.all(
      recentExams.map(async (exam) => {
        const results = await prisma.examResult.findMany({
          where: {
            examId: exam.id,
          },
        })

        const totalStudents = results.length
        const passedStudents = results.filter((result) => result.marksObtained >= exam.passingMarks).length
        const averageMarks =
          totalStudents > 0 ? results.reduce((sum, result) => sum + result.marksObtained, 0) / totalStudents : 0

        return {
          examId: exam.id,
          examName: exam.examName,
          subject: exam.subject?.subName,
          totalStudents,
          passedStudents,
          passPercentage: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
          averageMarks,
        }
      }),
    )

    const dashboardData = {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        class: teacher.teachSclass,
        subject: teacher.teachSubject,
        allSubjects: teacher.teachSclass.subjects, // All subjects in the class
      },
      stats: {
        totalStudents: teacher.teachSclass.students.length,
        totalSubjects: teacher.teachSclass.subjects.length,
        attendanceStats,
        examStats,
      },
      recentExams,
      recentAttendance,
      classPerformance,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
