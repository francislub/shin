import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all classes for a school
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
    const termId = req.nextUrl.searchParams.get("termId")

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const whereClause: any = { schoolId }

    if (termId) {
      whereClause.termId = termId
    }

    const classes = await prisma.sclass.findMany({
      where: whereClause,
      include: {
        term: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Get classes error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching classes" }, { status: 500 })
  }
}

// Create a new class
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
    const { sclassName, schoolId, termId } = body

    // Check if class already exists for this school and term
    const existingClass = await prisma.sclass.findFirst({
      where: {
        sclassName,
        schoolId,
        termId,
      },
    })

    if (existingClass) {
      return NextResponse.json({ error: "Class with this name already exists for this term" }, { status: 400 })
    }

    // Create new class
    const newClass = await prisma.sclass.create({
      data: {
        sclassName,
        school: {
          connect: { id: schoolId },
        },
        ...(termId && {
          term: {
            connect: { id: termId },
          },
        }),
      },
      include: {
        term: true,
      },
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error("Create class error:", error)
    return NextResponse.json({ error: "Something went wrong while creating class" }, { status: 500 })
  }
}
