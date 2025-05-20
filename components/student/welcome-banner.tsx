"use client"

import { useAuth } from "@/context/auth-context"
import { BookOpen, Calendar, Award } from "lucide-react"
import { useEffect, useState } from "react"

export function StudentWelcomeBanner() {
  const { user } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [subjectCount, setSubjectCount] = useState(0)
  const [averageGrade, setAverageGrade] = useState("-")

  useEffect(() => {
    // Update time of day
    const hours = new Date().getHours()
    if (hours < 12) setTimeOfDay("morning")
    else if (hours < 18) setTimeOfDay("afternoon")
    else setTimeOfDay("evening")

    // Update date
    setCurrentDate(new Date())

    // Fetch student stats
    const fetchStudentStats = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("/api/student/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSubjectCount(data.subjectCount || 0)
          setAverageGrade(data.averageGrade || "-")
        }
      } catch (error) {
        console.error("Error fetching student stats:", error)
      }
    }

    fetchStudentStats()
  }, [user])

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getRandomTip = () => {
    const tips = [
      "Remember to check your upcoming assignments and exams.",
      "You can view your attendance record in the Attendance section.",
      "Need help with a subject? Contact your teacher through Messages.",
      "Check your exam results in the Results section.",
      "Stay updated with school announcements in the Notices section.",
      "Check the calendar for upcoming school events and deadlines.",
      "Need help? Visit our documentation section for detailed guides.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 p-8 shadow-lg">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10"></div>

      <div className="relative">
        <div className="flex items-center">
          <BookOpen className="h-10 w-10 text-white" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">
              Good {timeOfDay}, {user?.firstName || user?.name || "Student"}!
            </h1>
            <p className="text-blue-100">Welcome to your Student Dashboard {user?.email ? `(${user.email})` : ""}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-100" />
              <span className="ml-2 text-sm font-medium text-blue-100">{formattedDate}</span>
            </div>
            <p className="mt-2 text-sm text-blue-100">You are enrolled in {subjectCount} subjects this term.</p>
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-blue-100" />
              <span className="ml-2 text-sm font-medium text-blue-100">Academic Performance</span>
            </div>
            <p className="mt-2 text-sm text-blue-100">
              Your current average grade is {averageGrade}. {getRandomTip()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
