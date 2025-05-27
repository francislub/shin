import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Teacher Marks Subjects API Called ===")

    // Get classId from query parameters
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    console.log("Class ID from query:", classId)

    if (!classId) {
      console.log("ERROR: No classId provided")
      return NextResponse.json(
        {
          error: "Class ID is required",
          details: "classId query parameter is missing",
        },
        { status: 400 },
      )
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("ERROR: Invalid or missing authorization header")
      return NextResponse.json(
        {
          error: "No token provided",
          details: "Authorization header is missing or invalid",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)
    console.log("Token extracted:", token ? "Present" : "Missing")

    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.log("ERROR: JWT_SECRET environment variable not found")
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "JWT_SECRET not configured",
        },
        { status: 500 },
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log("Token decoded successfully:", {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      })
    } catch (jwtError: any) {
      console.log("ERROR: JWT verification failed:", jwtError.message)
      return NextResponse.json(
        {
          error: "Invalid token",
          details: jwtError.message,
        },
        { status: 401 },
      )
    }

    if (decoded.role !== "Teacher") {
      console.log("ERROR: User is not a teacher:", decoded.role)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Only teachers can access this endpoint",
        },
        { status: 403 },
      )
    }

    console.log("Fetching teacher details for ID:", decoded.id)

    // Get teacher details first
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        teachSclassId: true,
        teachSubjectId: true,
      },
    })

    if (!teacher) {
      console.log("ERROR: Teacher not found in database")
      return NextResponse.json(
        {
          error: "Teacher not found",
          details: "Teacher record not found in database",
        },
        { status: 404 },
      )
    }

    console.log("Teacher found:", teacher.name)
    console.log("Fetching subjects for teacher:", decoded.id, "in class:", classId)

    try {
      // Get subjects taught by this teacher in the specified class
      // Using the correct relation syntax
      const subjects = await prisma.subject.findMany({
        where: {
          teacher: {
            id: decoded.id,
          },
          sclassName: {
            id: classId,
          },
        },
        select: {
          id: true,
          subName: true,
          subCode: true,
        },
        orderBy: {
          subName: "asc",
        },
      })

      console.log("Subjects found:", subjects.length)
      console.log("Subjects details:", subjects)

      // Transform data to match expected format
      const transformedSubjects = subjects.map((subject) => ({
        id: subject.id,
        name: subject.subName,
        code: subject.subCode,
      }))

      return NextResponse.json({
        success: true,
        subjects: transformedSubjects,
        debug: {
          teacherId: decoded.id,
          teacherName: teacher.name,
          classId: classId,
          subjectCount: subjects.length,
        },
      })
    } catch (dbError: any) {
      console.log("ERROR: Database error finding subjects:", dbError.message)
      return NextResponse.json(
        {
          error: "Database error",
          details: dbError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.log("ERROR: Unexpected error in teacher marks subjects API:", error.message)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
