import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Verify the token
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for enrollment chart
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const enrollmentData = months.map((month) => ({
      month,
      students: Math.floor(Math.random() * 50) + 20,
    }))

    return NextResponse.json(enrollmentData)
  } catch (error) {
    console.error("Error fetching enrollment chart data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
