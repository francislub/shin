import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, generateResetToken } from "@/lib/auth"
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    // Find the user based on role
    let user = null
    let userId = null

    if (role === "Admin") {
      user = await prisma.admin.findUnique({
        where: { email },
      })
      userId = user?.id
    } else if (role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { email },
      })
      userId = user?.id
    } else if (role === "Student") {
      user = await prisma.student.findUnique({
        where: { email },
      })
      userId = user?.id
    } else if (role === "Parent") {
      user = await prisma.parent.findUnique({
        where: { email },
      })
      userId = user?.id
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({ message: "If your email is registered, you will receive a password reset link" })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with reset token
    if (role === "Admin") {
      await prisma.admin.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })
    } else if (role === "Teacher") {
      await prisma.teacher.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })
    } else if (role === "Student") {
      await prisma.student.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })
    } else if (role === "Parent") {
      await prisma.parent.update({
        where: { id: userId },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })
    }

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&role=${role}`

    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: getPasswordResetEmailHtml(user.name, resetUrl),
    })

    return NextResponse.json({ message: "Password reset email sent successfully" })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Something went wrong during password reset" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, role, password } = body

    if (!token || !role || !password) {
      return NextResponse.json({ error: "Token, role, and password are required" }, { status: 400 })
    }

    // Find the user based on role and token
    let user = null
    let userId = null

    if (role === "Admin") {
      user = await prisma.admin.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })
      userId = user?.id
    } else if (role === "Teacher") {
      user = await prisma.teacher.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })
      userId = user?.id
    } else if (role === "Student") {
      user = await prisma.student.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })
      userId = user?.id
    } else if (role === "Parent") {
      user = await prisma.parent.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })
      userId = user?.id
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update user with new password and clear reset token
    if (role === "Admin") {
      await prisma.admin.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    } else if (role === "Teacher") {
      await prisma.teacher.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    } else if (role === "Student") {
      await prisma.student.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    } else if (role === "Parent") {
      await prisma.parent.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })
    }

    return NextResponse.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Something went wrong during password reset" }, { status: 500 })
  }
}
