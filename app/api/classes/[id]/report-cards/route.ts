import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get report cards for all students in a class
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing properties
    const { id: classId } = await params
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
    })

    // Get subjects for the class
    const subjects = await prisma.subject.findMany({
      where: { sclassId: classId },
      include: {
        teacher: true,
      },
    })

    // Get all exam results for students in this class and term
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

    // Get class teacher comments
    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    // Get head teacher comments
    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    // Get grading scale
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    // Helper functions
    const getGrade = (marks: number) => {
      const grade = gradingScale.find((g) => marks >= g.from && marks <= g.to)
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
      const examType = result.exam.examType

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
      subjectResults[examType] = {
        marks: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        grade: result.grade || getGrade((result.marksObtained / result.exam.totalMarks) * 100),
        remarks: result.remarks,
      }
    })

    // Generate report cards for all students
    const reportCards = await Promise.all(
      students.map(async (student) => {
        const studentResults = resultsByStudent.get(student.id) || new Map()

        // Format subject results for this student
        const formattedSubjects = subjects.map((subject) => {
          const subjectResults = studentResults.get(subject.id) || {
            BOT: null,
            MID: null,
            END: null,
          }

          const botMarks = subjectResults.BOT?.marks || 0
          const midMarks = subjectResults.MID?.marks || 0
          const endMarks = subjectResults.END?.marks || 0

          const botPercentage = subjectResults.BOT ? (botMarks / subjectResults.BOT.totalMarks) * 100 : 0
          const midPercentage = subjectResults.MID ? (midMarks / subjectResults.MID.totalMarks) * 100 : 0
          const endPercentage = subjectResults.END ? (endMarks / subjectResults.END.totalMarks) * 100 : 0

          // Determine teacher comment
          let teacherComment = "Good"
          if (endPercentage > midPercentage && midPercentage > 0) {
            teacherComment = "Improved"
          } else if (endPercentage < midPercentage && midPercentage > 0) {
            teacherComment = "Needs improvement"
          } else if (endPercentage === midPercentage && midPercentage > 0) {
            teacherComment = "Consistent"
          }

          return {
            id: subject.id,
            name: subject.subName,
            fullMarks: 100,
            botTerm: {
              marks: botMarks,
              grade: getGrade(botPercentage),
              percentage: Math.round(botPercentage),
            },
            midTerm: {
              marks: midMarks,
              grade: getGrade(midPercentage),
              percentage: Math.round(midPercentage),
            },
            endTerm: {
              marks: endMarks,
              grade: getGrade(endPercentage),
              percentage: Math.round(endPercentage),
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
          const validSubjects = formattedSubjects.filter((s) => s[termType].marks > 0)
          if (validSubjects.length === 0) return { total: 0, average: 0, grade: "N/A" }

          const total = validSubjects.reduce((sum, subject) => sum + subject[termType].marks, 0)
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
            botTerm: botTermStats,
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
