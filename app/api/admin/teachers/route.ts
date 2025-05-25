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

    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: decoded.id,
      },
      include: {
        teachSubject: {
          select: {
            id: true,
            subName: true,
            sclassName: true,
          },
        },
        teachSclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
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
    const { name, email, password, teachSubject, teachSclass } = body

    const teacher = await prisma.teacher.create({
      data: {
        name,
        email,
        password,
        teachSubject: teachSubject || [],
        teachSclass: teachSclass || [],
        schoolId: decoded.id,
      },
      include: {
        teachSubject: {
          select: {
            id: true,
            subName: true,
            sclassName: true,
          },
        },
        teachSclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
