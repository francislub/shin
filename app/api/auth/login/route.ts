import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, role } = body

    let user = null

    // Find user based on role
    if (role === "Admin") {
      user = await prisma.admin.findUnique({
        where: { email },
      })
    } else if (role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { email },
      })
    } else if (role === "Student") {
      // For students, we need to handle differently as they login with roll number
      user = await prisma.student.findFirst({
        where: { rollNum: email },
      })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is verified
    if (!user.verified) {
      return NextResponse.json({ error: "Please verify your email before logging in" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role,
    })

    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email || user.rollNum,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Something went wrong during login" }, { status: 500 })
  }
}
