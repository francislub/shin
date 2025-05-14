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

    // Current date
    const now = new Date()

    // Mock data for upcoming events
    const events = [
      {
        id: "1",
        title: "Parent-Teacher Meeting",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5).toISOString(),
        type: "meeting",
        description: "Quarterly parent-teacher meeting for all classes",
      },
      {
        id: "2",
        title: "Annual Sports Day",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12).toISOString(),
        type: "event",
        description: "Annual sports competition for all students",
      },
      {
        id: "3",
        title: "Science Exhibition",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15).toISOString(),
        type: "academic",
        description: "Science projects exhibition for classes 8-12",
      },
      {
        id: "4",
        title: "Term End Exams",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20).toISOString(),
        type: "exam",
        description: "End of term examinations begin for all classes",
      },
      {
        id: "5",
        title: "Teacher Training Workshop",
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 25).toISOString(),
        type: "training",
        description: "Professional development workshop for all teaching staff",
      },
    ]

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching upcoming events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
