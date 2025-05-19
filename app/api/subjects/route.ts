import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all subjects for a school
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

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
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

    // Validate required fields
    if (!subName || !subCode || !sessions || !sclassId || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create subject data
    const subjectData: any = {
      subName,
      subCode,
      sessions: String(sessions), // Convert to string to match schema
      sclassName: {
        connect: { id: sclassId },
      },
      school: {
        connect: { id: schoolId },
      },
    }

    // Add teacher if provided
    if (teacherId) {
      subjectData.teacher = {
        connect: { id: teacherId },
      }
    }

    // Create new subject
    const newSubject = await prisma.subject.create({
      data: subjectData,
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
