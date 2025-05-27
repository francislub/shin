import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Get subjects taught by this teacher in the specified class
    const subjects = await prisma.subject.findMany({
      where: {
        teacherId: decoded.id,
        sclassId: classId,
      },
      select: {
        id: true,
        subName: true,
        subCode: true,
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
      orderBy: {
        subName: "asc",
      },
    })

    // Transform the data to match the expected format
    const transformedSubjects = subjects.map((subject) => ({
      id: subject.id,
      name: subject.subName,
      code: subject.subCode,
      sclass: {
        id: subject.sclass.id,
        name: subject.sclass.sclassName,
        section: "", // Add section if available in your schema
      },
    }))

    return NextResponse.json(transformedSubjects)
  } catch (error) {
    console.error("Error fetching teacher subjects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
