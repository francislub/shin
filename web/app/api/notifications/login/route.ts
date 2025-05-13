import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

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

    // Get user data based on role and ID
    const { id, role } = decoded

    let user = null
    let email = ""

    if (role === "Admin") {
      user = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      if (user) {
        email = user.email
      }
    } else if (role === "Teacher") {
      user = await prisma.teacher.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      if (user) {
        email = user.email
      }
    } else if (role === "HeadTeacher") {
      // Implement head teacher user retrieval and email
    } else if (role === "Parent") {
      // Implement parent user retrieval and email
    }

    if (!user || !email) {
      return NextResponse.json({ error: "User not found or no email available" }, { status: 404 })
    }

    // Send login notification email
    const now = new Date()
    const formattedDate = now.toLocaleString()

    await sendEmail({
      to: email,
      subject: "New Login to Your Account",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2>New Login to Your Account</h2>
          <p>Hello ${user.name},</p>
          <p>We detected a new login to your account on ${formattedDate}.</p>
          <p>If this was you, no action is needed. If you didn't log in, please change your password immediately.</p>
          <p>Thank you,<br>School Management System</p>
        </div>
      `,
    })

    return NextResponse.json({ message: "Login notification sent successfully" })
  } catch (error) {
    console.error("Login notification error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
