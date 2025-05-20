import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Verify the token
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Define month names
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Initialize chart data with all months
    const chartData = months.map((month) => ({
      name: month,
      students: 0,
      teachers: 0,
    }))

    // Get current year
    const currentYear = new Date().getFullYear()

    // For MongoDB, we need to use aggregation instead of $queryRaw
    // Get student enrollment data by month for current year
    const studentsByMonth = await getStudentsByMonth(currentYear)
    const teachersByMonth = await getTeachersByMonth(currentYear)

    // Populate chart data with actual values
    studentsByMonth.forEach((item) => {
      const monthIndex = item._id - 1 // MongoDB months are 1-indexed
      if (monthIndex >= 0 && monthIndex < 12) {
        chartData[monthIndex].students = item.count
      }
    })

    teachersByMonth.forEach((item) => {
      const monthIndex = item._id - 1 // MongoDB months are 1-indexed
      if (monthIndex >= 0 && monthIndex < 12) {
        chartData[monthIndex].teachers = item.count
      }
    })

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Error fetching enrollment chart data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get students by month using MongoDB aggregation
async function getStudentsByMonth(year: number) {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

  const result = await prisma.student.aggregateRaw({
    pipeline: [
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ],
  })

  // Convert the result to the expected format
  return (result as any[]).map((item) => ({
    _id: item._id,
    count: item.count,
  }))
}

// Helper function to get teachers by month using MongoDB aggregation
async function getTeachersByMonth(year: number) {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

  const result = await prisma.teacher.aggregateRaw({
    pipeline: [
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ],
  })

  // Convert the result to the expected format
  return (result as any[]).map((item) => ({
    _id: item._id,
    count: item.count,
  }))
}
