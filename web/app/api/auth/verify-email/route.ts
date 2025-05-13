import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    const role = req.nextUrl.searchParams.get("role")

    if (!token || !role) {
      return NextResponse.json({ error: "Token and role are required" }, { status: 400 })
    }

    let user = null
    let userId = null

    // Check if user with this token exists based on role
    if (role === "Admin") {
      user = await prisma.admin.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Teacher") {
      user = await prisma.teacher.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Student") {
      user = await prisma.student.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Parent") {
      user = await prisma.parent.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Update user verification status
    if (role === "Admin") {
      await prisma.admin.update({
        where: { id: userId },
        data: {
          verified: true,
          verificationToken: null,
        },
      })
    } else if (role === "Teacher") {
      await prisma.teacher.update({
        where: { id: userId },
        data: {
          verified: true,
          verificationToken: null,
        },
      })
    } else if (role === "Student") {
      await prisma.student.update({
        where: { id: userId },
        data: {
          verified: true,
          verificationToken: null,
        },
      })
    } else if (role === "Parent") {
      await prisma.parent.update({
        where: { id: userId },
        data: {
          verified: true,
          verificationToken: null,
        },
      })
    }

    return NextResponse.redirect(new URL("/login?verified=true", req.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Something went wrong during email verification" }, { status: 500 })
  }
}
