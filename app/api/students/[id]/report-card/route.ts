import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get report card for a specific student
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Await params before accessing properties
    const { id: studentId } = await params
    const termId = req.nextUrl.searchParams.get("termId")
    const reportType = req.nextUrl.searchParams.get("type") || "mid-end" // Default to mid-end

    if (!termId) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 })
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    // Get subjects for the student's class
    const subjects = await prisma.subject.findMany({
      where: { sclassId: student.sclassId },
      include: {
        teacher: true,
      },
    })

    // Get all exam results for the student in this term
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: studentId,
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
      },
    })

    // Get class teacher comments
    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Get head teacher comments
    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Get grading scale
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Helper function to get grade based on marks
    const getGrade = (marks: number) => {
      const grade = gradingScale.find((g) => marks >= g.from && marks <= g.to)
      return grade ? grade.grade : "F"
    }

    // Helper function to calculate division based on grade
    const calculateDivision = (gradeStr: string) => {
      const grade = gradingScale.find((g) => g.grade === gradeStr)
      if (!grade) return "X"

      const gradeNumber = gradingScale.length - gradingScale.findIndex((g) => g.grade === gradeStr)

      if (gradeNumber >= 4 && gradeNumber <= 12) return "I"
      if (gradeNumber >= 13 && gradeNumber <= 24) return "II"
      if (gradeNumber >= 25 && gradeNumber <= 28) return "III"
      if (gradeNumber >= 29 && gradeNumber <= 32) return "IV"
      if (gradeNumber >= 33 && gradeNumber <= 36) return "U"
      return "X"
    }

    // Helper function to get comment based on average
    const getComment = (comments: any[], average: number) => {
      return (
        comments.find((comment) => average >= comment.from && average <= comment.to)?.comment || "No comment available"
      )
    }

    // Group exam results by subject and exam type
    const resultsBySubject = new Map()

    examResults.forEach((result) => {
      const subjectId = result.subjectId
      const examType = result.exam.examType

      if (!resultsBySubject.has(subjectId)) {
        resultsBySubject.set(subjectId, {
          subject: result.subject,
          BOT: null,
          MID: null,
          END: null,
        })
      }

      const subjectResults = resultsBySubject.get(subjectId)
      subjectResults[examType] = {
        marks: result.marksObtained,
        totalMarks: result.exam.totalMarks,
        grade: result.grade || getGrade((result.marksObtained / result.exam.totalMarks) * 100),
        remarks: result.remarks,
      }
    })

    // Format subject results based on report type
    const formattedSubjects = subjects.map((subject) => {
      const subjectResults = resultsBySubject.get(subject.id) || {
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

      // Determine teacher comment based on performance
      let teacherComment = "Good"
      if (reportType === "bot-mid") {
        if (midPercentage > botPercentage && botPercentage > 0) {
          teacherComment = "Improved"
        } else if (midPercentage < botPercentage && botPercentage > 0) {
          teacherComment = "Needs improvement"
        } else if (midPercentage === botPercentage && botPercentage > 0) {
          teacherComment = "Consistent"
        }
      } else {
        if (endPercentage > midPercentage && midPercentage > 0) {
          teacherComment = "Improved"
        } else if (endPercentage < midPercentage && midPercentage > 0) {
          teacherComment = "Needs improvement"
        } else if (endPercentage === midPercentage && midPercentage > 0) {
          teacherComment = "Consistent"
        }
      }

      const subjectData: any = {
        id: subject.id,
        name: subject.subName,
        fullMarks: 100,
        teacherComment,
        teacherInitials:
          subject.teacher?.name
            .split(" ")
            .map((n) => n[0])
            .join(".") || "N/A",
      }

      // Add exam data based on report type
      if (reportType === "bot-mid") {
        subjectData.botTerm = {
          marks: botMarks,
          grade: getGrade(botPercentage),
          percentage: Math.round(botPercentage),
        }
        subjectData.midTerm = {
          marks: midMarks,
          grade: getGrade(midPercentage),
          percentage: Math.round(midPercentage),
        }
      } else {
        subjectData.midTerm = {
          marks: midMarks,
          grade: getGrade(midPercentage),
          percentage: Math.round(midPercentage),
        }
        subjectData.endTerm = {
          marks: endMarks,
          grade: getGrade(endPercentage),
          percentage: Math.round(endPercentage),
        }
      }

      return subjectData
    })

    // Calculate overall performance based on report type
    const calculateTermStats = (termType: "botTerm" | "midTerm" | "endTerm") => {
      const validSubjects = formattedSubjects.filter((s) => s[termType] && s[termType].marks > 0)
      if (validSubjects.length === 0) return { total: 0, average: 0, grade: "N/A", division: "X" }

      const total = validSubjects.reduce((sum, subject) => sum + subject[termType].marks, 0)
      const average = Math.round(total / validSubjects.length)
      const grade = getGrade(average)
      const division = calculateDivision(grade)

      return {
        total,
        average,
        grade,
        division,
      }
    }

    const performance: any = {}

    if (reportType === "bot-mid") {
      performance.botTerm = calculateTermStats("botTerm")
      performance.midTerm = calculateTermStats("midTerm")
    } else {
      performance.midTerm = calculateTermStats("midTerm")
      performance.endTerm = calculateTermStats("endTerm")
    }

    // Get appropriate comments based on final term average
    const finalAverage = reportType === "bot-mid" ? performance.midTerm.average : performance.endTerm.average
    const classTeacherComment = getComment(classTeacherComments, finalAverage)
    const headTeacherComment = getComment(headTeacherComments, finalAverage)

    // Calculate attendance percentage
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: studentId,
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

    // Compile report card data
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
      performance: performance,
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
    console.error("Get report card error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching report card" }, { status: 500 })
  }
}
