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

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Remove sensitive data
    const { password, verificationToken, ...adminData } = admin as any

    return NextResponse.json(adminData)
  } catch (error) {
    console.error("Get admin profile error:", error)
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

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, schoolName } = body

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    })

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (name) updateData.name = name
    if (email && email !== existingAdmin.email) {
      // Check if email is already in use
      const emailExists = await prisma.admin.findUnique({
        where: { email },
      })

      if (emailExists && emailExists.id !== decoded.id) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }

      updateData.email = email
    }
    if (schoolName && schoolName !== existingAdmin.schoolName) {
      // Check if school name is already in use
      const schoolNameExists = await prisma.admin.findUnique({
        where: { schoolName },
      })

      if (schoolNameExists && schoolNameExists.id !== decoded.id) {
        return NextResponse.json({ error: "School name is already in use" }, { status: 400 })
      }

      updateData.schoolName = schoolName
    }

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id: decoded.id },
      data: updateData,
    })

    // Remove sensitive data
    const { password, verificationToken, ...adminData } = updatedAdmin as any

    return NextResponse.json(adminData)
  } catch (error) {
    console.error("Update admin profile error:", error)
    return NextResponse.json({ error: "Something went wrong while updating profile" }, { status: 500 })
  }
}
