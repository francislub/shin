import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get comprehensive report card for a specific student with all exam types
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const termId = req.nextUrl.searchParams.get("termId")
    if (!termId) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 })
    }

    // Get student with all related data
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        sclass: true,
        school: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get term details
    const term = await prisma.term.findUnique({
      where: { id: termId },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Get all subjects for the student's class
    const subjects = await prisma.subject.findMany({
      where: { sclassId: student.sclassId },
      include: {
        teacher: true,
      },
    })

    // Get all exam results for the student in this term
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: id,
        exam: {
          termId: termId,
          sclassId: student.sclassId,
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        subject: true,
      },
    })

    // Get grading scale from database
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Get teacher comments
    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Get attendance records for percentage calculation
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: id,
        sclassId: student.sclassId,
        date: {
          gte: new Date(term.year + "-01-01"),
          lte: new Date(term.year + "-12-31"),
        },
      },
    })

    // Helper function to get grade based on marks and grading scale
    const getGrade = (percentage: number) => {
      const grade = gradingScale.find((g) => percentage >= g.from && percentage <= g.to)
      return grade ? grade.grade : "F"
    }

    // Helper function to get appropriate comment
    const getComment = (comments: any[], average: number) => {
      return (
        comments.find((comment) => average >= comment.from && average <= comment.to)?.comment || "No comment available"
      )
    }

    // Group exam results by subject and exam type
    const resultsBySubject = new Map()

    examResults.forEach((result) => {
      const subjectId = result.subjectId
      const examType = result.exam.examType.toUpperCase()

      if (!resultsBySubject.has(subjectId)) {
        resultsBySubject.set(subjectId, {
          subject: result.subject,
          BOT: null,
          MID: null,
          END: null,
        })
      }

      const subjectResults = resultsBySubject.get(subjectId)
      const percentage = (result.marksObtained / result.exam.totalMarks) * 100

      subjectResults[examType] = {
        marks: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        percentage: Math.round(percentage),
        grade: result.grade || getGrade(percentage),
        remarks: result.remarks,
      }
    })

    // Format subjects with all exam results
    const formattedSubjects = subjects.map((subject) => {
      const subjectResults = resultsBySubject.get(subject.id) || {
        BOT: null,
        MID: null,
        END: null,
      }

      const botData = subjectResults.BOT
      const midData = subjectResults.MID
      const endData = subjectResults.END

      // Generate teacher comment based on performance trend
      let teacherComment = "Good"
      if (endData && midData) {
        if (endData.percentage > midData.percentage) {
          teacherComment = "Improved"
        } else if (endData.percentage < midData.percentage) {
          teacherComment = "Needs improvement"
        } else {
          teacherComment = "Consistent"
        }
      } else if (endData && endData.percentage >= 80) {
        teacherComment = "Excellent"
      } else if (endData && endData.percentage >= 60) {
        teacherComment = "Good"
      } else if (endData && endData.percentage < 50) {
        teacherComment = "Needs improvement"
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

    // Calculate performance statistics
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

    // Calculate attendance percentage
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter((record) => record.status === "Present").length
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

    // Get appropriate comments
    const classTeacherComment = getComment(classTeacherComments, endTermStats.average)
    const headTeacherComment = getComment(headTeacherComments, endTermStats.average)

    // Compile final report card data
    const reportCard = {
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
        name: student.school.schoolName,
        id: student.school.id,
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

    return NextResponse.json(reportCard)
  } catch (error) {
    console.error("Get student report card error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching report card" }, { status: 500 })
  }
}
