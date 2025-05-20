import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { name, email, password, schoolId, teachSclassId, teachSubjectId } = body

    // Basic validation for required fields
    if (!name || !email || !password || !schoolId || !teachSclassId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create teacher data object
    const teacherData: any = {
      name,
      email,
      password: hashedPassword,
      verified: true, // Set verified to true by default
      role: "Teacher",
      school: {
        connect: { id: schoolId },
      },
      teachSclass: {
        connect: { id: teachSclassId },
      },
    }

    // Create the teacher without subject first
    const newTeacher = await prisma.teacher.create({
      data: teacherData,
    })

    // If a subject ID was provided, try to connect it
    // Note: Due to the @unique constraint, this might fail if the subject is already assigned
    if (teachSubjectId && teachSubjectId !== "not_assigned") {
      try {
        await prisma.teacher.update({
          where: { id: newTeacher.id },
          data: {
            teachSubject: {
              connect: { id: teachSubjectId },
            },
          },
        })
      } catch (error) {
        console.log("Could not assign subject to teacher. It may already be assigned to another teacher.")
        // We don't return an error here, just continue without the subject assignment
      }
    }

    // Fetch the complete teacher data
    const completeTeacher = await prisma.teacher.findUnique({
      where: { id: newTeacher.id },
      include: {
        teachSclass: true,
        teachSubject: true,
      },
    })

    // Remove sensitive data
    const { password: _, verificationToken: __, ...teacherDataSanitized } = completeTeacher as any

    return NextResponse.json(
      {
        ...teacherDataSanitized,
        message: "Teacher created successfully.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create teacher error:", error)

    // Handle duplicate email error
    if ((error as any).code === 11000 || (error as any).code === "P2002") {
      return NextResponse.json({ error: "A teacher with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create teacher", details: (error as Error).message }, { status: 500 })
  }
}
