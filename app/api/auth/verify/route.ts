import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user data based on role
    const { id, role } = decoded
    let userData = null
    let schoolId = null

    // Normalize role for database queries (case-sensitive match)
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

    if (normalizedRole === "Admin") {
      userData = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
      // For admin, the schoolId is the admin's id
      schoolId = id
    } else if (normalizedRole === "Teacher") {
      userData = await prisma.teacher.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          schoolId: true,
        },
      })
      if (userData) {
        schoolId = userData.schoolId
      }
    } else if (normalizedRole === "Student") {
      userData = await prisma.student.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          rollNum: true,
          schoolId: true,
        },
      })
      if (userData) {
        schoolId = userData.schoolId
      }
    } else if (normalizedRole === "Parent") {
      userData = await prisma.parent.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          schoolId: true,
        },
      })
      if (userData) {
        schoolId = userData.schoolId
      }
    }

    if (!userData) {
      console.error(`User not found: id=${id}, role=${role}, normalizedRole=${normalizedRole}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data with role (using the original role casing from the token)
    const response = {
      id: userData.id,
      name: userData.name,
      email: userData.email || userData.rollNum,
      role,
    }

    // Add schoolId to the response
    if (schoolId) {
      response.schoolId = schoolId
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json({ error: "Authentication error" }, { status: 500 })
  }
}
