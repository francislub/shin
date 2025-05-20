"use client"

import { useAuth } from "@/context/auth-context"
import { Users, Calendar, Bell } from "lucide-react"
import { useEffect, useState } from "react"

export function ParentWelcomeBanner() {
  const { user } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [childrenCount, setChildrenCount] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)

  useEffect(() => {
    // Update time of day
    const hours = new Date().getHours()
    if (hours < 12) setTimeOfDay("morning")
    else if (hours < 18) setTimeOfDay("afternoon")
    else setTimeOfDay("evening")

    // Update date
    setCurrentDate(new Date())

    // Fetch parent stats
    const fetchParentStats = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("/api/parent/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChildrenCount(data.childrenCount || 0)
          setPendingPayments(data.pendingPayments || 0)
        }
      } catch (error) {
        console.error("Error fetching parent stats:", error)
      }
    }

    fetchParentStats()
  }, [user])

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const getRandomTip = () => {
    const tips = [
      "Check your children's attendance records regularly.",
      "You can view your children's exam results in the Results section.",
      "Need to contact a teacher? Use the Messages feature for quick communication.",
      "Stay updated with school announcements in the Notices section.",
      "You can make fee payments through the Payments section.",
      "Check the calendar for upcoming school events and parent-teacher meetings.",
      "Need help? Visit our documentation section for detailed guides.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 p-8 shadow-lg">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white/10"></div>

      <div className="relative">
        <div className="flex items-center">
          <Users className="h-10 w-10 text-white" />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white">
              Good {timeOfDay}, {user?.firstName || user?.name || "Parent"}!
            </h1>
            <p className="text-amber-100">Welcome to your Parent Dashboard {user?.email ? `(${user.email})` : ""}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-amber-100" />
              <span className="ml-2 text-sm font-medium text-amber-100">{formattedDate}</span>
            </div>
            <p className="mt-2 text-sm text-amber-100">
              You have {childrenCount} {childrenCount === 1 ? "child" : "children"} enrolled in our school.
            </p>
          </div>

          <div className="rounded-md bg-white/10 p-4">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-amber-100" />
              <span className="ml-2 text-sm font-medium text-amber-100">Pro Tip</span>
            </div>
            <p className="mt-2 text-sm text-amber-100">
              {pendingPayments > 0
                ? `You have ${pendingPayments} pending payment(s). Please check the Payments section.`
                : getRandomTip()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
