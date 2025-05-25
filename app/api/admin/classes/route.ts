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

    const classes = await prisma.sclass.findMany({
      where: {
        schoolId: decoded.id,
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            rollNum: true,
          },
        },
        subjects: true,
        teachers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        sclassName: "asc",
      },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
