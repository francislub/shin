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

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for recent activities
    const activities = [
      {
        id: "1",
        type: "student",
        action: "registered",
        name: "John Smith",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        details: "New student registered for Class 10A",
      },
      {
        id: "2",
        type: "teacher",
        action: "updated",
        name: "Sarah Johnson",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        details: "Updated class schedule for Mathematics",
      },
      {
        id: "3",
        type: "admin",
        action: "created",
        name: "Admin",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        details: "Created new notice for upcoming parent-teacher meeting",
      },
      {
        id: "4",
        type: "parent",
        action: "submitted",
        name: "Robert Davis",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        details: "Submitted leave application for student Emily Davis",
      },
      {
        id: "5",
        type: "system",
        action: "generated",
        name: "System",
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        details: "Generated monthly attendance reports for all classes",
      },
    ]

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
