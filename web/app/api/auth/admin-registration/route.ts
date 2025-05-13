import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json({ error: "An admin with this email already exists" }, { status: 400 })
    }

    // Generate registration token
    const token = randomBytes(32).toString("hex")

    // Store token in database
    await prisma.adminRegistrationToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Send registration email
    const registrationUrl = `${process.env.NEXTAUTH_URL}/register/admin/${token}`

    await sendEmail({
      to: email,
      subject: "Complete Your Admin Registration",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2>Complete Your Admin Registration</h2>
          <p>Hello,</p>
          <p>You have been invited to register as an administrator for the School Management System. Please click the button below to complete your registration:</p>
          <a href="${registrationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Complete Registration</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this registration, you can ignore this email.</p>
          <p>Thank you,<br>School Management System</p>
        </div>
      `,
    })

    return NextResponse.json({ message: "Registration email sent successfully" })
  } catch (error) {
    console.error("Admin registration error:", error)
    return NextResponse.json({ error: "Something went wrong during registration" }, { status: 500 })
  }
}
