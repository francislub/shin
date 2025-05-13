import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all subjects for a school or class
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

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        sclassName: true,
        teacher: true,
      },
      orderBy: { subName: "asc" },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Get subjects error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching subjects" }, { status: 500 })
  }
}

// Create a new subject
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
    const { subName, subCode, sessions, sclassId, teacherId, schoolId } = body

    // Check if subject already exists for this class
    const existingSubject = await prisma.subject.findFirst({
      where: {
        subName,
        sclassId,
        schoolId,
      },
    })

    if (existingSubject) {
      return NextResponse.json({ error: "Subject with this name already exists for this class" }, { status: 400 })
    }

    // Create new subject
    const newSubject = await prisma.subject.create({
      data: {
        subName,
        subCode,
        sessions,
        sclassName: {
          connect: { id: sclassId },
        },
        ...(teacherId && {
          teacher: {
            connect: { id: teacherId },
          },
        }),
        school: {
          connect: { id: schoolId },
        },
      },
      include: {
        sclassName: true,
        teacher: true,
      },
    })

    return NextResponse.json(newSubject, { status: 201 })
  } catch (error) {
    console.error("Create subject error:", error)
    return NextResponse.json({ error: "Something went wrong while creating subject" }, { status: 500 })
  }
}
