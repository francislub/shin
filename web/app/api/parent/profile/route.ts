import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({
      where: { id: decoded.id },
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Remove sensitive data
    const { password, verificationToken, ...parentData } = parent as any

    return NextResponse.json(parentData)
  } catch (error) {
    console.error("Get parent profile error:", error)
    return NextResponse.json({ error: "Something went wrong while fetching profile" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, address } = body

    // Check if parent exists
    const existingParent = await prisma.parent.findUnique({
      where: { id: decoded.id },
    })

    if (!existingParent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (name) updateData.name = name
    if (email && email !== existingParent.email) {
      // Check if email is already in use
      const emailExists = await prisma.parent.findUnique({
        where: { email },
      })

      if (emailExists && emailExists.id !== decoded.id) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }

      updateData.email = email
    }
    if (phone) updateData.phone = phone
    if (address) updateData.address = address

    // Update parent
    const updatedParent = await prisma.parent.update({
      where: { id: decoded.id },
      data: updateData,
      include: {
        students: {
          include: {
            sclass: true,
          },
        },
      },
    })

    // Remove sensitive data
    const { password, verificationToken, ...parentData } = updatedParent as any

    return NextResponse.json(parentData)
  } catch (error) {
    console.error("Update parent profile error:", error)
    return NextResponse.json({ error: "Something went wrong while updating profile" }, { status: 500 })
  }
}
