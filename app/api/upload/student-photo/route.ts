import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// Upload student photo
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await req.formData()
    const studentId = formData.get("studentId") as string
    const photo = formData.get("photo") as File

    if (!studentId || !photo) {
      return NextResponse.json({ error: "Student ID and photo are required" }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // In a real implementation, you would upload the photo to a storage service
    // and save the URL in the database. For this example, we'll simulate this process.

    // Simulate photo upload and get URL
    const photoUrl = `https://example.com/student-photos/${studentId}-${Date.now()}.jpg`

    // Update student with photo URL
    await prisma.student.update({
      where: { id: studentId },
      data: { photo: photoUrl },
    })

    return NextResponse.json({
      message: "Photo uploaded successfully",
      photoUrl,
    })
  } catch (error) {
    console.error("Upload student photo error:", error)
    return NextResponse.json({ error: "Something went wrong while uploading student photo" }, { status: 500 })
  }
}
