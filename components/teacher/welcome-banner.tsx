"use client"

import { useAuth } from "@/context/auth-context"
import { BookOpen, Calendar, Bell } from "lucide-react"
import { useEffect, useState } from "react"

export function TeacherWelcomeBanner() {
  const { user } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [classCount, setClassCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)

  useEffect(() => {
    // Update time of day
    const hours = new Date().getHours()
    if (hours < 12) setTimeOfDay("morning")
    else if (hours < 18) setTimeOfDay("afternoon")
    else setTimeOfDay("evening")

    // Update date
    setCurrentDate(new Date())

    // Fetch teacher stats
    const fetchTeacherStats = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token || !user?.id) return

        const response = await fetch(`/api/teachers/${user.id}/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setClassCount(data.totalClasses || 0)
          setStudentCount(data.totalStudents || 0)
        }
      } catch (error) {
        console.error("Error fetching teacher stats:", error)
      }
    }

    fetchTeacherStats()
  }, [user])

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getRandomTip = () => {
    const tips = [
      "Remember to mark attendance for all your classes today.",
      "You can view student performance in the Results section.",
      "Need to contact a parent? Use the Messages feature for quick communication.",
      "Upcoming exams can be scheduled from the Exams section.",
      "You can create and share study materials with your students.",
      "Check the calendar for upcoming school events and deadlines.",
      "Need help? Visit our documentation section for detailed guides.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 p-8 shadow-lg">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10"></div>

      <div className="relative">
        <div className="flex items-center">
          <BookOpen className="h-10 w-10 text-white" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">
              Good {timeOfDay}, {user?.firstName || user?.name || "Teacher"}!
            </h1>
            <p className="text-teal-100">Welcome to your Teacher Dashboard {user?.email ? `(${user.email})` : ""}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-teal-100" />
              <span className="ml-2 text-sm font-medium text-teal-100">{formattedDate}</span>
            </div>
            <p className="mt-2 text-sm text-teal-100">
              You are teaching {classCount} classes with a total of {studentCount} students.
            </p>
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-teal-100" />
              <span className="ml-2 text-sm font-medium text-teal-100">Pro Tip</span>
            </div>
            <p className="mt-2 text-sm text-teal-100">{getRandomTip()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
