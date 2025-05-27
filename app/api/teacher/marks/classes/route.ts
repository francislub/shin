import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Teacher Marks Classes API Called ===")

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader) {
      console.log("ERROR: No authorization header found")
      return NextResponse.json(
        {
          error: "No authorization header provided",
          details: "Authorization header is missing from request",
        },
        { status: 401 },
      )
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("ERROR: Invalid authorization header format:", authHeader)
      return NextResponse.json(
        {
          error: "Invalid authorization header format",
          details: "Authorization header must start with 'Bearer '",
        },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    console.log("Token extracted:", token ? "Present" : "Missing")

    if (!token) {
      console.log("ERROR: No token found after Bearer prefix")
      return NextResponse.json(
        {
          error: "No token provided",
          details: "Token is empty after Bearer prefix",
        },
        { status: 401 },
      )
    }

    // Check if JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET
    console.log("JWT_SECRET:", jwtSecret ? "Present" : "Missing")

    if (!jwtSecret) {
      console.log("ERROR: JWT_SECRET environment variable not set")
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
      decoded = jwt.verify(token, jwtSecret)
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
          details: `JWT verification failed: ${jwtError.message}`,
        },
        { status: 401 },
      )
    }

    // Check if user has teacher role
    if (decoded.role !== "Teacher") {
      console.log("ERROR: User role is not Teacher:", decoded.role)
      return NextResponse.json(
        {
          error: "Unauthorized access",
          details: `User role '${decoded.role}' is not authorized for this endpoint`,
        },
        { status: 403 },
      )
    }

    console.log("Fetching teacher details for ID:", decoded.id)

    // Get teacher details first
    let teacher
    try {
      teacher = await prisma.teacher.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          teachSclassId: true,
          teachSubjectId: true,
        },
      })
      console.log("Teacher found:", teacher ? "Yes" : "No")
      if (teacher) {
        console.log("Teacher details:", {
          id: teacher.id,
          name: teacher.name,
          classId: teacher.teachSclassId,
          subjectId: teacher.teachSubjectId,
        })
      }
    } catch (dbError: any) {
      console.log("ERROR: Database error finding teacher:", dbError.message)
      return NextResponse.json(
        {
          error: "Database error",
          details: `Failed to find teacher: ${dbError.message}`,
        },
        { status: 500 },
      )
    }

    if (!teacher) {
      console.log("ERROR: Teacher not found in database for ID:", decoded.id)
      return NextResponse.json(
        {
          error: "Teacher not found",
          details: `No teacher record found for ID: ${decoded.id}`,
        },
        { status: 404 },
      )
    }

    console.log("Fetching classes for teacher...")

    // Get classes where teacher is assigned - Fixed the Prisma query
    let classes
    try {
      // First, let's get the class where teacher is class teacher
      const classTeacherClasses = teacher.teachSclassId
        ? await prisma.sclass.findMany({
            where: {
              id: teacher.teachSclassId,
            },
            select: {
              id: true,
              sclassName: true,
              _count: {
                select: {
                  students: true,
                },
              },
            },
          })
        : []

      // Then get classes where teacher teaches a subject
      const subjectTeacherClasses = await prisma.sclass.findMany({
        where: {
          subjects: {
            some: {
              teacher: {
                id: teacher.id,
              },
            },
          },
        },
        select: {
          id: true,
          sclassName: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      })

      // Combine and deduplicate classes
      const allClasses = [...classTeacherClasses, ...subjectTeacherClasses]
      const uniqueClasses = allClasses.filter((cls, index, self) => index === self.findIndex((c) => c.id === cls.id))

      classes = uniqueClasses.sort((a, b) => a.sclassName.localeCompare(b.sclassName))

      console.log("Classes found:", classes.length)
      console.log(
        "Classes details:",
        classes.map((c) => ({ id: c.id, name: c.sclassName, students: c._count.students })),
      )
    } catch (dbError: any) {
      console.log("ERROR: Database error finding classes:", dbError.message)
      return NextResponse.json(
        {
          error: "Database error",
          details: `Failed to find classes: ${dbError.message}`,
        },
        { status: 500 },
      )
    }

    // Transform data to match expected format
    const transformedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.sclassName,
      studentCount: cls._count.students,
    }))

    console.log("Returning classes:", transformedClasses)

    return NextResponse.json({
      success: true,
      classes: transformedClasses,
      debug: {
        teacherId: teacher.id,
        teacherName: teacher.name,
        classCount: classes.length,
      },
    })
  } catch (error: any) {
    console.log("ERROR: Unexpected error in teacher marks classes API:", error.message)
    console.log("Error stack:", error.stack)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
