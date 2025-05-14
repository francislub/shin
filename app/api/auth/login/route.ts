import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, role } = body

    console.log("Login attempt:", { email, role })

    let user = null

    // Find user based on role
    if (role === "Admin") {
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
    } else if (role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          verified: true,
        },
      })
    } else if (role === "Student") {
      // For students, we need to handle differently as they login with roll number
      user = await prisma.student.findFirst({
        where: { rollNum: email },
        select: {
          id: true,
          rollNum: true,
          name: true,
          password: true,
          verified: true,
        },
      })
    } else if (role === "Parent") {
      user = await prisma.parent.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          verified: true,
        },
      })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("User found:", {
      id: user?.id,
      name: user?.name,
      verified: user?.verified,
      email: user?.email || user?.rollNum,
    })

    // Check if user is verified
    if (!user.verified) {
      console.log("Login failed: User not verified", { id: user.id, role })
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          verified: false,
        },
        { status: 401 },
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    try {
      // Generate JWT token - ensure role is stored exactly as provided
      const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email || user.rollNum,
        role: role, // Keep the exact role casing
      })

      // Return user data and token
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email || user.rollNum,
          role, // Keep the exact role casing
        },
        token,
      })
    } catch (tokenError) {
      console.error("Token generation error:", tokenError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Something went wrong during login" }, { status: 500 })
  }
}
