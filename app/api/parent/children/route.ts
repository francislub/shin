import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parentId = decoded.id

    // Fetch children for the parent with appropriate fields
    const children = await prisma.student.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        sclass: {
          include: {
            subjects: true,
          },
        },
        examResults: {
          include: {
            exam: true,
            subject: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        attendanceRecords: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
      },
    })

    // Transform data to add calculated fields
    const enhancedChildren = children.map((child) => {
      // Calculate attendance percentage
      const totalRecords = child.attendanceRecords.length
      const presentCount = child.attendanceRecords.filter((record) => record.status === "Present").length
      const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

      // Calculate average grade
      const recentResults = child.examResults
      const totalMarks = recentResults.reduce((sum, result) => sum + result.marksObtained, 0)
      const averageGrade = recentResults.length > 0 ? totalMarks / recentResults.length : 0

      return {
        id: child.id,
        name: child.name,
        rollNum: child.rollNum,
        photo: child.photo,
        gender: child.gender,
        className: child.sclass?.sclassName || "N/A",
        classId: child.sclass?.id,
        attendancePercentage: Math.round(attendancePercentage),
        averageGrade: Math.round(averageGrade),
        recentExams: child.examResults.map((result) => ({
          id: result.id,
          examName: result.exam?.examName || "Unknown",
          subjectName: result.subject?.subjectName || "Unknown",
          marks: result.marksObtained,
          totalMarks: result.totalMarks,
        })),
      }
    })

    return NextResponse.json(enhancedChildren)
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 })
  }
}
