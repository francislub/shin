import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword, generateVerificationToken } from "@/lib/auth"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"

// Get all teachers for a school
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

    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        teachSclass: true,
        teachSubject: true,
      },
      orderBy: { name: "asc" },
    })

    // Remove sensitive data
    const sanitizedTeachers = teachers.map((teacher) => {
      const { password, verificationToken, ...teacherData } = teacher as any
      return teacherData
    })

    return NextResponse.json(sanitizedTeachers)
  } catch (error) {
    console.error("Get teachers error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching teachers" }, { status: 500 })
  }
}

// Create a new teacher
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
    const { name, email, password, teachSclassId, teachSubjectId, schoolId } = body

    // Check if teacher with this email already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { email },
    })

    if (existingTeacher) {
      return NextResponse.json({ error: "Teacher with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create new teacher
    const newTeacher = await prisma.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
        teachSclass: {
          connect: { id: teachSclassId },
        },
        ...(teachSubjectId && {
          teachSubject: {
            connect: { id: teachSubjectId },
          },
        }),
        school: {
          connect: { id: schoolId },
        },
      },
      include: {
        teachSclass: true,
        teachSubject: true,
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
    const { password: _, verificationToken: __, ...teacherData } = newTeacher as any

    return NextResponse.json(
      {
        ...teacherData,
        message: "Teacher created successfully. Verification email sent.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create teacher error:", error)
    return NextResponse.json({ error: "Something went wrong while creating teacher" }, { status: 500 })
  }
}
