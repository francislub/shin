import { NextResponse } from "next/server"
import { generateMessageTemplate } from "@/lib/ai-utils"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { context, messageType } = await request.json()

    if (!context || !messageType) {
      return NextResponse.json({ error: "Context and message type are required" }, { status: 400 })
    }

    // Validate message type
    const validMessageTypes = [
      "attendance_warning",
      "academic_improvement",
      "positive_feedback",
      "event_announcement",
      "parent_meeting",
      "exam_reminder",
      "fee_reminder",
      "general_notice",
      "behavior_concern",
      "achievement_recognition",
    ]

    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        {
          error: "Invalid message type",
          validTypes: validMessageTypes,
        },
        { status: 400 },
      )
    }

    // Generate message template using AI
    const messageTemplate = await generateMessageTemplate(context, messageType)

    return NextResponse.json({
      messageTemplate,
      messageType,
    })
  } catch (error) {
    console.error("Error generating message suggestion:", error)
    return NextResponse.json({ error: "Failed to generate message suggestion" }, { status: 500 })
  }
}
