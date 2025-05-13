import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, hashPassword, generateVerificationToken } from "@/lib/auth"
import { sendEmail, getVerificationEmailHtml } from "@/lib/email"

// Get all students for a school or class
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
    const sclassId = req.nextUrl.searchParams.get("sclassId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const whereClause: any = { schoolId }

    if (sclassId) {
      whereClause.sclassId = sclassId
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        sclass: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching students" }, { status: 500 })
  }
}

// Create a new student
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
    const { name, rollNum, password, sclassId, schoolId, gender, email } = body

    // Check if student with this roll number already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        rollNum,
        schoolId,
      },
    })

    if (existingStudent) {
      return NextResponse.json({ error: "Student with this roll number already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token if email is provided
    const verificationToken = email ? generateVerificationToken() : null

    // Create new student
    const newStudent = await prisma.student.create({
      data: {
        name,
        rollNum,
        password: hashedPassword,
        gender,
        verificationToken,
        sclass: {
          connect: { id: sclassId },
        },
        school: {
          connect: { id: schoolId },
        },
      },
      include: {
        sclass: true,
      },
    })

    // Send verification email if email is provided
    if (email && verificationToken) {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`

      await sendEmail({
        to: email,
        subject: "Verify your email address",
        html: getVerificationEmailHtml(name, verificationUrl),
      })
    }

    // Return success response without sensitive data
    return NextResponse.json(
      {
        id: newStudent.id,
        name: newStudent.name,
        rollNum: newStudent.rollNum,
        gender: newStudent.gender,
        sclass: newStudent.sclass,
        message: email ? "Student created successfully. Verification email sent." : "Student created successfully.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create student error:", error)
    return NextResponse.json({ error: "Something went wrong while creating student" }, { status: 500 })
  }
}
