import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: decoded.id,
      },
      include: {
        school: {
          select: {
            id: true,
            schoolName: true,
          },
        },
      },
      orderBy: {
        subName: "asc",
      },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subName, subCode, sclassName } = body

    const subject = await prisma.subject.create({
      data: {
        subName,
        subCode,
        sclassName,
        schoolId: decoded.id,
      },
      include: {
        school: {
          select: {
            id: true,
            schoolName: true,
          },
        },
      },
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
