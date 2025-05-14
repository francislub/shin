import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword, generateVerificationToken } from "@/lib/auth"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"

// Get all parents for a school
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

    const schoolId = req.nextUrl.searchParams.get("schoolId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const parents = await prisma.parent.findMany({
      where: { schoolId },
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Remove sensitive data
    const sanitizedParents = parents.map((parent) => {
      const { password, verificationToken, ...parentData } = parent as any
      return parentData
    })

    return NextResponse.json(sanitizedParents)
  } catch (error) {
    console.error("Get parents error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching parents" }, { status: 500 })
  }
}

// Create a new parent
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, phone, address, studentIds, schoolId } = body

    // Check if parent with this email already exists
    const existingParent = await prisma.parent.findUnique({
      where: { email },
    })

    if (existingParent) {
      return NextResponse.json({ error: "Parent with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create new parent
    const newParent = await prisma.parent.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        verificationToken,
        school: {
          connect: { id: schoolId },
        },
        students: {
          connect: studentIds.map((id: string) => ({ id })),
        },
      },
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
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
    const { password: _, verificationToken: __, ...parentData } = newParent as any

    return NextResponse.json(
      {
        ...parentData,
        message: "Parent created successfully. Verification email sent.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create parent error:", error)
    return NextResponse.json({ error: "Something went wrong while creating parent" }, { status: 500 })
  }
}
