import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get report cards for all students in a class
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: classId } = await params
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const termId = req.nextUrl.searchParams.get("termId")
    if (!termId) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 })
    }

    // Get class details
    const sclass = await prisma.sclass.findUnique({
      where: { id: classId },
      include: {
        school: true,
      },
    })

    if (!sclass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Get term details
    const term = await prisma.term.findUnique({
      where: { id: termId },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { sclassId: classId },
      include: {
        sclass: true,
      },
      orderBy: { rollNum: "asc" },
    })

    // Get subjects for the class
    const subjects = await prisma.subject.findMany({
      where: { sclassId: classId },
      include: {
        teacher: true,
      },
    })

    // Get all exam results for the class and term
    const examResults = await prisma.examResult.findMany({
      where: {
        student: {
          sclassId: classId,
        },
        exam: {
          termId: termId,
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        subject: true,
        student: true,
      },
    })

    // Get grading scale and comments
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    // Helper functions
    const getGrade = (percentage: number) => {
      const grade = gradingScale.find((g) => percentage >= g.from && percentage <= g.to)
      return grade ? grade.grade : "F"
    }

    const getComment = (comments: any[], average: number) => {
      return (
        comments.find((comment) => average >= comment.from && average <= comment.to)?.comment || "No comment available"
      )
    }

    // Group exam results by student and subject
    const resultsByStudent = new Map()

    examResults.forEach((result) => {
      const studentId = result.studentId
      const subjectId = result.subjectId
      const examType = result.exam.examType.toUpperCase()

      if (!resultsByStudent.has(studentId)) {
        resultsByStudent.set(studentId, new Map())
      }

      const studentResults = resultsByStudent.get(studentId)

      if (!studentResults.has(subjectId)) {
        studentResults.set(subjectId, {
          subject: result.subject,
          BOT: null,
          MID: null,
          END: null,
        })
      }

      const subjectResults = studentResults.get(subjectId)
      const percentage = (result.marksObtained / result.exam.totalMarks) * 100

      subjectResults[examType] = {
        marks: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        percentage: Math.round(percentage),
        grade: result.grade || getGrade(percentage),
        remarks: result.remarks,
      }
    })

    // Generate report cards for all students
    const reportCards = await Promise.all(
      students.map(async (student) => {
        const studentResults = resultsByStudent.get(student.id) || new Map()

        // Format subjects for this student
        const formattedSubjects = subjects.map((subject) => {
          const subjectResults = studentResults.get(subject.id) || {
            BOT: null,
            MID: null,
            END: null,
          }

          const botData = subjectResults.BOT
          const midData = subjectResults.MID
          const endData = subjectResults.END

          // Generate teacher comment
          let teacherComment = "Good"
          if (endData && midData) {
            if (endData.percentage > midData.percentage) {
              teacherComment = "Improved"
            } else if (endData.percentage < midData.percentage) {
              teacherComment = "Needs improvement"
            } else {
              teacherComment = "Consistent"
            }
          }

          return {
            id: subject.id,
            name: subject.subName,
            fullMarks: 100,
            botTerm: botData
              ? {
                  marks: botData.marks,
                  grade: botData.grade,
                  percentage: botData.percentage,
                }
              : undefined,
            midTerm: {
              marks: midData?.marks || 0,
              grade: midData?.grade || "N/A",
              percentage: midData?.percentage || 0,
            },
            endTerm: {
              marks: endData?.marks || 0,
              grade: endData?.grade || "N/A",
              percentage: endData?.percentage || 0,
            },
            teacherComment,
            teacherInitials:
              subject.teacher?.name
                .split(" ")
                .map((n) => n[0])
                .join(".") || "N/A",
          }
        })

        // Calculate performance stats
        const calculateTermStats = (termType: "botTerm" | "midTerm" | "endTerm") => {
          const validSubjects = formattedSubjects.filter((s) => {
            if (termType === "botTerm") {
              return s.botTerm && s.botTerm.marks > 0
            }
            return s[termType].marks > 0
          })

          if (validSubjects.length === 0) return { total: 0, average: 0, grade: "N/A" }

          const total = validSubjects.reduce((sum, subject) => {
            if (termType === "botTerm") {
              return sum + (subject.botTerm?.marks || 0)
            }
            return sum + subject[termType].marks
          }, 0)

          const average = Math.round(total / validSubjects.length)

          return {
            total,
            average,
            grade: getGrade(average),
          }
        }

        const botTermStats = calculateTermStats("botTerm")
        const midTermStats = calculateTermStats("midTerm")
        const endTermStats = calculateTermStats("endTerm")

        // Get attendance data
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            studentId: student.id,
            sclassId: student.sclassId,
            date: {
              gte: new Date(term.year + "-01-01"),
              lte: new Date(term.year + "-12-31"),
            },
          },
        })

        const totalDays = attendanceRecords.length
        const presentDays = attendanceRecords.filter((record) => record.status === "Present").length
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

        const classTeacherComment = getComment(classTeacherComments, endTermStats.average)
        const headTeacherComment = getComment(headTeacherComments, endTermStats.average)

        return {
          student: {
            id: student.id,
            name: student.name,
            rollNum: student.rollNum,
            gender: student.gender,
            photo: student.photo,
            class: student.sclass.sclassName,
            year: term.year,
          },
          school: {
            name: sclass.school.schoolName,
            id: sclass.school.id,
          },
          term: {
            id: term.id,
            name: term.termName,
            year: term.year,
            nextTermStarts: term.nextTermStarts,
            nextTermEnds: term.nextTermEnds,
          },
          subjects: formattedSubjects,
          performance: {
            botTerm: botTermStats.total > 0 ? botTermStats : undefined,
            midTerm: midTermStats,
            endTerm: endTermStats,
          },
          conduct: {
            discipline: student.discipline || "Good",
            timeManagement: student.timeManagement || "Good",
            smartness: student.smartness || "Good",
            attendanceRemarks: student.attendanceRemarks || "Regular",
            attendancePercentage,
          },
          comments: {
            classTeacher: classTeacherComment,
            headTeacher: headTeacherComment,
          },
          gradingScale: gradingScale,
        }
      }),
    )

    return NextResponse.json({
      class: {
        id: sclass.id,
        name: sclass.sclassName,
      },
      term: {
        id: term.id,
        name: term.termName,
        year: term.year,
      },
      school: {
        name: sclass.school.schoolName,
        id: sclass.school.id,
      },
      gradingScale: gradingScale,
      reportCards: reportCards,
    })
  } catch (error) {
    console.error("Get class report cards error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching class report cards" }, { status: 500 })
  }
}
