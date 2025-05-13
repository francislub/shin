import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Check if admin with this token exists
    const admin = await prisma.admin.findFirst({
      where: { verificationToken: token },
    })

    if (admin) {
      // Update admin verification status
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          verified: true,
          verificationToken: null,
        },
      })

      return NextResponse.redirect(new URL("/login?verified=true", req.url))
    }

    // Check if teacher with this token exists
    const teacher = await prisma.teacher.findFirst({
      where: { verificationToken: token },
    })

    if (teacher) {
      // Update teacher verification status
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          verified: true,
          verificationToken: null,
        },
      })

      return NextResponse.redirect(new URL("/login?verified=true", req.url))
    }

    // Check if student with this token exists
    const student = await prisma.student.findFirst({
      where: { verificationToken: token },
    })

    if (student) {
      // Update student verification status
      await prisma.student.update({
        where: { id: student.id },
        data: {
          verified: true,
          verificationToken: null,
        },
      })

      return NextResponse.redirect(new URL("/login?verified=true", req.url))
    }

    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Something went wrong during email verification" }, { status: 500 })
  }
}
