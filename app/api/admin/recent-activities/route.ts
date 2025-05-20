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

    // Get recent activities from various tables
    const recentActivities = []

    // Get recent student registrations
    const studentRegistrations = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        sclass: {
          select: {
            sclassName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    })

    studentRegistrations.forEach((student) => {
      recentActivities.push({
        id: `student-${student.id}`,
        type: "student",
        action: "registered",
        name: student.name,
        timestamp: student.createdAt.toISOString(),
        details: `New student registered for ${student.sclass?.sclassName || "a class"}`,
      })
    })

    // Get recent teacher activities
    const teacherActivities = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
        teachSubject: {
          select: {
            subName: true,
          },
        },
      },
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    })

    teacherActivities.forEach((teacher) => {
      recentActivities.push({
        id: `teacher-${teacher.id}`,
        type: "teacher",
        action: "updated",
        name: teacher.name,
        timestamp: teacher.updatedAt.toISOString(),
        details: `Updated class schedule for ${teacher.teachSubject?.subName || "a subject"}`,
      })
    })

    // Get recent notices
    const recentNotices = await prisma.notice.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        school: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    })

    recentNotices.forEach((notice) => {
      recentActivities.push({
        id: `notice-${notice.id}`,
        type: "admin",
        action: "created",
        name: notice.school ? notice.school.name : "Admin",
        timestamp: notice.createdAt.toISOString(),
        details: `Created new notice: ${notice.title}`,
      })
    })

    // Get recent parent activities
    const parentActivities = await prisma.parent.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
        students: {
          select: {
            name: true,
          },
          take: 1,
        },
      },
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    })

    parentActivities.forEach((parent) => {
      const childName = parent.students[0] ? parent.students[0].name : "their child"

      recentActivities.push({
        id: `parent-${parent.id}`,
        type: "parent",
        action: "submitted",
        name: parent.name,
        timestamp: parent.updatedAt.toISOString(),
        details: `Submitted leave application for student ${childName}`,
      })
    })

    // Sort all activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return only the 5 most recent activities
    return NextResponse.json(recentActivities.slice(0, 5))
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
