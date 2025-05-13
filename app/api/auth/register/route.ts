import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, generateVerificationToken } from "@/lib/auth"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, schoolName, role } = body

    // Check if user already exists
    const existingUser = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Check if school name already exists
    const existingSchool = await prisma.admin.findFirst({
      where: { schoolName },
    })

    if (existingSchool) {
      return NextResponse.json({ error: "School with this name already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        schoolName,
        role,
        verificationToken,
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`

    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: getVerificationEmailHtml(name, verificationUrl),
    })

    // Return success response without sensitive data
    return NextResponse.json(
      {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        schoolName: newAdmin.schoolName,
        role: newAdmin.role,
        message: "Registration successful. Please verify your email.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Something went wrong during registration" }, { status: 500 })
  }
}
