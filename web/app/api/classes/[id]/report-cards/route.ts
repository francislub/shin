import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get report cards for all students in a class
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classId = params.id
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

    // Get class teacher comments
    const classTeacherComments = await prisma.classTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
    })

    // Get head teacher comments
    const headTeacherComments = await prisma.headTeacherComment.findMany({
      where: { schoolId: sclass.schoolId },
    })

    // Get grading scale
    const gradingScale = await prisma.grading.findMany({
      where: { schoolId: sclass.schoolId },
      orderBy: { from: "desc" },
    })

    // Helper functions
    const calculateTotalAndAverage = (examResults: any[]) => {
      if (!examResults || examResults.length === 0) return { total: 0, average: 0 }

      const total = examResults.reduce((sum, result) => sum + result.marksObtained, 0)
      const average = Math.round(total / examResults.length)

      return { total, average }
    }

    const getGrade = (marks: number) => {
      const grade = gradingScale.find((g) => marks >= g.from && marks <= g.to)
      return grade ? grade.grade : "N/A"
    }

    const getComment = (comments: any[], average: number) => {
      return (
        comments.find((comment) => average >= comment.from && average <= comment.to)?.comment || "No comment available"
      )
    }

    // Generate report cards for all students
    const reportCards = students.map((student) => {
      // Get exam results for the student
      const examResults = {
        midExam: student.midExamResult || [],
        endExam: student.endExamResult || [],
      }

      const midTermStats = calculateTotalAndAverage(examResults.midExam)
      const endTermStats = calculateTotalAndAverage(examResults.endExam)

      const classTeacherComment = getComment(classTeacherComments, endTermStats.average)
      const headTeacherComment = getComment(headTeacherComments, endTermStats.average)

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
      }
    })

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
