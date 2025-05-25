import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "Teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher details with related data
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id },
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
          },
        },
        teachSubject: true,
        exams: {
          include: {
            subject: true,
            sclass: true,
            results: true,
          },
          orderBy: {
            startDate: "desc",
          },
          take: 5,
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get recent attendance records
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: {
        teacherId: session.id,
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
        teacherId: session.id,
        date: {
          gte: startOfMonth,
          lte: today,
        },
      },
    })

    const attendanceStats = {
      totalRecords: monthlyAttendance.length,
      presentCount: monthlyAttendance.filter(record => record.status === "Present").length,
      absentCount: monthlyAttendance.filter(record => record.status === "Absent").length,
      lateCount: monthlyAttendance.filter(record => record.status === "Late").length,
    }

    // Get exam statistics
    const examStats = {
      totalExams: teacher.exams.length,
      upcomingExams: teacher.exams.filter(exam => new Date(exam.startDate) > today).length,
      completedExams: teacher.exams.filter(exam => new Date(exam.endDate) < today).length,
    }

    // Get class performance summary
    const classPerformance = await Promise.all(
      teacher.exams.map(async (exam) => {
        const results = await prisma.examResult.findMany({
          where: {
            examId: exam.id,
          },
        })

        const totalStudents = results.length
        const passedStudents = results.filter(result => result.marksObtained >= exam.passingMarks).length
        const averageMarks = totalStudents > 0 
          ? results.reduce((sum, result) => sum + result.marksObtained, 0) / totalStudents 
          : 0

        return {
          examId: exam.id,
          examName: exam.examName,
          subject: exam.subject?.subName,
          totalStudents,
          passedStudents,
          passPercentage: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
          averageMarks,
        }
      })
    )

    const dashboardData = {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        class: teacher.teachSclass,
        subject: teacher.teachSubject,
      },
      stats: {
        totalStudents: teacher.teachSclass.students.length,
        attendanceStats,
        examStats,
      },
      recentExams: teacher.exams,
      recentAttendance,
      classPerformance,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching teacher dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
