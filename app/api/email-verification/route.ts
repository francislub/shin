import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"
import { generateVerificationToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()

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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user with verification token
    if (role === "Admin") {
      await prisma.admin.update({
        where: { id: userId },
        data: { verificationToken },
      })
    } else if (role === "Teacher") {
      await prisma.teacher.update({
        where: { id: userId },
        data: { verificationToken },
      })
    } else if (role === "Student") {
      await prisma.student.update({
        where: { id: userId },
        data: { verificationToken },
      })
    } else if (role === "Parent") {
      await prisma.parent.update({
        where: { id: userId },
        data: { verificationToken },
      })
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}&role=${role}`

    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: getVerificationEmailHtml(user.name, verificationUrl),
    })

    return NextResponse.json({ message: "Verification email sent successfully" })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Something went wrong during email verification" }, { status: 500 })
  }
}
