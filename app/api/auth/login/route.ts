import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Normalize role for database queries
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

    let user = null
    let schoolId = null

    // Find user based on role
    if (normalizedRole === "Admin") {
      user = await prisma.admin.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          verified: true,
        },
      })
    } else if (normalizedRole === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          verified: true,
          schoolId: true,
        },
      })
      if (user) {
        schoolId = user.schoolId
      }
    } else if (normalizedRole === "Student") {
      // Change from findUnique to findFirst since rollNum is not marked as @unique in the schema
      user = await prisma.student.findFirst({
        where: { rollNum: email },
        select: {
          id: true,
          rollNum: true,
          name: true,
          password: true,
          verified: true,
          schoolId: true,
        },
      })
      if (user) {
        schoolId = user.schoolId
      }
    } else if (normalizedRole === "Parent") {
      user = await prisma.parent.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          verified: true,
          schoolId: true,
        },
      })
      if (user) {
        schoolId = user.schoolId
      }
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is verified (if applicable)
    // For students, we'll allow login even if not verified
    if (user.verified === false && normalizedRole !== "Student") {
      return NextResponse.json({ error: "Account not verified. Please check your email." }, { status: 403 })
    }

    // If it's a student and not verified, we'll auto-verify them
    if (normalizedRole === "Student" && user.verified === false) {
      // Update the student record to set verified to true
      await prisma.student.update({
        where: { id: user.id },
        data: { verified: true },
      })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email || user.rollNum,
      role: normalizedRole,
    })

    // Return user data and token
    const responseData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email || user.rollNum,
        role: normalizedRole,
      },
      token,
    }

    // Add schoolId to response for non-admin users
    if (schoolId) {
      responseData.schoolId = schoolId
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
