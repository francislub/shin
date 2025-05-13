import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, verifyPassword, hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    // Find the user based on role and id
    let user

    if (decoded.role === "Admin") {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
      })
    } else if (decoded.role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { id: decoded.id },
      })
    } else if (decoded.role === "Student") {
      user = await prisma.student.findUnique({
        where: { id: decoded.id },
      })
    } else if (decoded.role === "Parent") {
      user = await prisma.parent.findUnique({
        where: { id: decoded.id },
      })
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password based on user role
    if (decoded.role === "Admin") {
      await prisma.admin.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      })
    } else if (decoded.role === "Teacher") {
      await prisma.teacher.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      })
    } else if (decoded.role === "Student") {
      await prisma.student.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      })
    } else if (decoded.role === "Parent") {
      await prisma.parent.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Something went wrong while changing password" }, { status: 500 })
  }
}
