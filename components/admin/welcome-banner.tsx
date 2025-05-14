"use client"

import { useAuth } from "@/context/auth-context"
import { GraduationCap, Calendar, Bell } from "lucide-react"
import { useEffect, useState } from "react"

export function WelcomeBanner() {
  const { user } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    // Update time of day
    const hours = new Date().getHours()
    if (hours < 12) setTimeOfDay("morning")
    else if (hours < 18) setTimeOfDay("afternoon")
    else setTimeOfDay("evening")

    // Update date
    setCurrentDate(new Date())
  }, [user]) // Add user as a dependency to refresh when user data changes

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getRandomTip = () => {
    const tips = [
      "Remember to check recent student activities in the dashboard.",
      "You can send announcements to all users from the Notices section.",
      "Need to contact a teacher? Use the Messages feature for quick communication.",
      "Regular data backups are recommended. Visit Settings to configure automatic backups.",
      "You can generate detailed reports from the Reports section.",
      "Check the calendar for upcoming events and deadlines.",
      "Need help? Visit our documentation section for detailed guides.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 p-8 shadow-lg mb-6">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10"></div>

      <div className="relative">
        <div className="flex items-center">
          <GraduationCap className="h-10 w-10 text-white" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">
              Good {timeOfDay}, {user?.name || "User"}!
            </h1>
            <p className="text-indigo-100">
              Welcome to your {user?.role || "Dashboard"} {user?.email ? `(${user.email})` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-indigo-100" />
              <span className="ml-2 text-sm font-medium text-indigo-100">{formattedDate}</span>
            </div>
            <p className="mt-2 text-sm text-indigo-100">
              You have access to all {user?.role || "system"} features and tools. Manage your school efficiently!
            </p>
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-indigo-100" />
              <span className="ml-2 text-sm font-medium text-indigo-100">Pro Tip</span>
            </div>
            <p className="mt-2 text-sm text-indigo-100">{getRandomTip()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
