import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get report card for a specific student
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

    const studentId = params.id
    const termId = req.nextUrl.searchParams.get("termId")

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

    // Get exam results for the student
    const examResults = {
      botExam: student.botExamResult || [],
      midExam: student.midExamResult || [],
      endExam: student.endExamResult || [],
    }

    // Get attendance records
    const attendance = student.attendance || []

    // Get class teacher comments
    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: student.schoolId },
    })

    // Get head teacher comments
    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: student.schoolId },
    })

    // Get grading scale
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: student.schoolId },
      orderBy: { from: "desc" },
    })

    // Calculate total marks and averages
    const calculateTotalAndAverage = (examResults: any[]) => {
      if (!examResults || examResults.length === 0) return { total: 0, average: 0 }

      const total = examResults.reduce((sum, result) => sum + result.marksObtained, 0)
      const average = Math.round(total / examResults.length)

      return { total, average }
    }

    const midTermStats = calculateTotalAndAverage(examResults.midExam)
    const endTermStats = calculateTotalAndAverage(examResults.endExam)

    // Determine appropriate comments based on average score
    const getComment = (comments: any[], average: number) => {
      return (
        comments.find((comment) => average >= comment.from && average <= comment.to)?.comment || "No comment available"
      )
    }

    const classTeacherComment = getComment(classTeacherComments, endTermStats.average)
    const headTeacherComment = getComment(headTeacherComments, endTermStats.average)

    // Format subject results with grades
    const getGrade = (marks: number) => {
      const grade = gradingScale.find((g) => marks >= g.from && marks <= g.to)
      return grade ? grade.grade : "N/A"
    }

    const formattedSubjects = subjects.map((subject) => {
      const midTermResult = examResults.midExam.find((r) => r.subName === subject.id)
      const endTermResult = examResults.endExam.find((r) => r.subName === subject.id)

      return {
        id: subject.id,
        name: subject.subName,
        fullMarks: 100,
        midTerm: {
          marks: midTermResult?.marksObtained || 0,
          grade: getGrade(midTermResult?.marksObtained || 0),
        },
        endTerm: {
          marks: endTermResult?.marksObtained || 0,
          grade: getGrade(endTermResult?.marksObtained || 0),
        },
        teacherComment:
          midTermResult?.marksObtained && endTermResult?.marksObtained
            ? endTermResult.marksObtained > midTermResult.marksObtained
              ? "Improved"
              : endTermResult.marksObtained < midTermResult.marksObtained
                ? "Needs improvement"
                : "Consistent"
            : "No comment",
        teacherInitials:
          subject.teacher?.name
            .split(" ")
            .map((n) => n[0])
            .join(".") || "N/A",
      }
    })

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
      performance: {
        midTerm: {
          total: midTermStats.total,
          average: midTermStats.average,
          grade: getGrade(midTermStats.average),
        },
        endTerm: {
          total: endTermStats.total,
          average: endTermStats.average,
          grade: getGrade(endTermStats.average),
        },
      },
      conduct: {
        discipline: student.discipline || "Good",
        timeManagement: student.timeManagement || "Good",
        smartness: student.smartness || "Good",
        attendanceRemarks: student.attendanceRemarks || "Regular",
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
