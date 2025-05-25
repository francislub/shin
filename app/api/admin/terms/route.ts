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

    const terms = await prisma.term.findMany({
      where: {
        schoolId: decoded.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(terms)
  } catch (error) {
    console.error("Error fetching terms:", error)
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
    const { termName, startDate, endDate } = body

    const term = await prisma.term.create({
      data: {
        termName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId: decoded.id,
      },
    })

    return NextResponse.json(term)
  } catch (error) {
    console.error("Error creating term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
