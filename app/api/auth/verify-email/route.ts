import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    const role = req.nextUrl.searchParams.get("role") || "Admin" // Default to Admin if not specified

    console.log("Verification request received:", { token, role })

    if (!token) {
      console.log("Verification failed: Missing token")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    let user = null
    let userId = null

    // Check if user with this token exists based on role
    if (role === "Admin") {
      user = await prisma.admin.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Teacher") {
      user = await prisma.teacher.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Student") {
      user = await prisma.student.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else if (role === "Parent") {
      user = await prisma.parent.findFirst({
        where: { verificationToken: token },
      })
      userId = user?.id
    } else {
      console.log("Verification failed: Invalid role", { role })
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (!user) {
      console.log("Verification failed: User not found", { token, role })
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    console.log("User found for verification:", {
      id: userId,
      role,
      email: user.email || user.rollNum,
      currentVerificationStatus: user.verified,
    })

    // Update user verification status
    try {
      if (role === "Admin") {
        await prisma.admin.update({
          where: { id: userId },
          data: {
            verified: true,
            verificationToken: null,
          },
        })
      } else if (role === "Teacher") {
        await prisma.teacher.update({
          where: { id: userId },
          data: {
            verified: true,
            verificationToken: null,
          },
        })
      } else if (role === "Student") {
        await prisma.student.update({
          where: { id: userId },
          data: {
            verified: true,
            verificationToken: null,
          },
        })
      } else if (role === "Parent") {
        await prisma.parent.update({
          where: { id: userId },
          data: {
            verified: true,
            verificationToken: null,
          },
        })
      }

      console.log("User verified successfully:", { id: userId, role })

      // Double-check that the update was successful
      let verifiedUser = null
      if (role === "Admin") {
        verifiedUser = await prisma.admin.findUnique({
          where: { id: userId },
          select: { verified: true },
        })
      } else if (role === "Teacher") {
        verifiedUser = await prisma.teacher.findUnique({
          where: { id: userId },
          select: { verified: true },
        })
      } else if (role === "Student") {
        verifiedUser = await prisma.student.findUnique({
          where: { id: userId },
          select: { verified: true },
        })
      } else if (role === "Parent") {
        verifiedUser = await prisma.parent.findUnique({
          where: { id: userId },
          select: { verified: true },
        })
      }

      console.log("Verification status after update:", {
        id: userId,
        verified: verifiedUser?.verified,
      })
    } catch (updateError) {
      console.error("Failed to update user verification status:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update verification status",
          details: JSON.stringify(updateError),
        },
        { status: 500 },
      )
    }

    // Return success response with JSON
    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      {
        error: "Something went wrong during email verification",
        details: JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}
