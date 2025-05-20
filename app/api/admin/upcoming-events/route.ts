import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

    // Get current date
    const now = new Date()

    // Get date 30 days from now
    const thirtyDaysFromNow = new Date(now)
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    // Get upcoming events from various tables
    const upcomingEvents = []

    // Get upcoming exams
    const exams = await prisma.exam.findMany({
      where: {
        startDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        subject: true,
        sclass: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    exams.forEach((exam) => {
      upcomingEvents.push({
        id: `exam-${exam.id}`,
        title: `${exam.examName} - ${exam.subject.subName}`,
        date: exam.startDate.toISOString(),
        type: "exam",
        description: `${exam.examName} for ${exam.subject.subName} in ${exam.sclass.sclassName}`,
      })
    })

    // Get upcoming notices (using date field as event date)
    const notices = await prisma.notice.findMany({
      where: {
        date: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    notices.forEach((notice) => {
      upcomingEvents.push({
        id: `notice-${notice.id}`,
        title: notice.title,
        date: notice.date.toISOString(),
        type: "event",
        description: notice.details.substring(0, 100) + (notice.details.length > 100 ? "..." : ""),
      })
    })

    // Get upcoming payments
    const payments = await prisma.payment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: "Pending",
      },
      include: {
        student: true,
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 10,
    })

    payments.forEach((payment) => {
      upcomingEvents.push({
        id: `payment-${payment.id}`,
        title: `Payment Due - ${payment.student.name}`,
        date: payment.dueDate.toISOString(),
        type: "payment",
        description: `Payment of ${payment.amount} due for ${payment.description}`,
      })
    })

    // Sort all events by date (earliest first)
    upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(upcomingEvents)
  } catch (error) {
    console.error("Error fetching upcoming events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
