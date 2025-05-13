import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Find token in database
    const registrationToken = await prisma.adminRegistrationToken.findUnique({
      where: { token },
    })

    if (!registrationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Check if token is expired
    if (registrationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    return NextResponse.json({ email: registrationToken.email })
  } catch (error) {
    console.error("Verify registration token error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
