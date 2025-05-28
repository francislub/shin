import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parentId = resolvedParams.id

    // Verify the parent is accessing their own children
    if (decoded.id !== parentId) {
      return NextResponse.json({ error: "Forbidden: Cannot access other parent's children" }, { status: 403 })
    }

    // Fetch children for the parent with more details
    const children = await prisma.student.findMany({
      where: {
        parentId: parentId,
      },
      select: {
        id: true,
        name: true,
        rollNum: true,
        gender: true,
        photo: true,
        sclass: {
          select: {
            id: true,
            sclassName: true,
          },
        },
      },
    })

    return NextResponse.json(children)
  } catch (error) {
    console.error("Error fetching children:", error)
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 })
  }
}
