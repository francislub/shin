import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user data based on role and ID
    const { id, role } = decoded

    let user = null

    if (role === "Admin") {
      user = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
    } else if (role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
    } else if (role === "Student") {
      user = await prisma.student.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          rollNum: true,
          role: true,
        },
      })

      if (user) {
        user.email = user.rollNum
      }
    } else if (role === "Parent") {
      // Implement parent user retrieval
    } else if (role === "HeadTeacher") {
      // Implement head teacher user retrieval
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
