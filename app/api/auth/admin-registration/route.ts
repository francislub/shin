// app/api/auth/admin-registration/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 }
      )
    }

    // Generate token
    const token = randomBytes(32).toString("hex")

    // Store token
    if (!prisma.adminRegistrationToken) {
      throw new Error("Model adminRegistrationToken not found in Prisma schema.")
    }

    await prisma.adminRegistrationToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    })

    const registrationUrl = `${process.env.NEXTAUTH_URL}/register/admin/${token}`

    await sendEmail({
      to: email,
      subject: "Complete Your Admin Registration",
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Complete Your Admin Registration</h2>
          <p>Please click the button below to complete registration:</p>
          <a href="${registrationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Complete Registration</a>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: "Registration email sent successfully" })
  } catch (error: any) {
    console.error("Admin registration error:", error)
    return NextResponse.json(
      { error: error?.message || "Something went wrong during registration" },
      { status: 500 }
    )
  }
}
