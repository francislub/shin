import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Get all terms for a school
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

    const terms = await prisma.term.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(terms)
  } catch (error) {
    console.error("Get terms error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching terms" }, { status: 500 })
  }
}

// Create a new term
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
    const { termName, nextTermStarts, nextTermEnds, year, schoolId } = body

    // Check if there's already an active term
    if (body.status === "Active") {
      const activeTerms = await prisma.term.findMany({
        where: {
          schoolId,
          status: "Active",
        },
      })

      // If there are active terms, update them to inactive
      if (activeTerms.length > 0) {
        await prisma.term.updateMany({
          where: {
            schoolId,
            status: "Active",
          },
          data: {
            status: "Inactive",
          },
        })
      }
    }

    // Create new term
    const newTerm = await prisma.term.create({
      data: {
        termName,
        nextTermStarts,
        nextTermEnds,
        year,
        status: body.status || "Active",
        school: {
          connect: { id: schoolId },
        },
      },
    })

    return NextResponse.json(newTerm, { status: 201 })
  } catch (error) {
    console.error("Create term error:", error)
    return NextResponse.json({ error: "Something went wrong while creating term" }, { status: 500 })
  }
}
