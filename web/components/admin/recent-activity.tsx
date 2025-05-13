"use client"

import { useState, useEffect } from "react"
import { UserPlus, BookOpen, Bell, Calendar, School, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Activity {
  id: string
  type: "user" | "subject" | "notice" | "term" | "class"
  description: string
  timestamp: string
}

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/admin/recent-activities", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch recent activities",
          })
        }
      } catch (error) {
        console.error("Recent activities error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching recent activities",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [toast])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "subject":
        return <BookOpen className="h-5 w-5 text-green-500" />
      case "notice":
        return <Bell className="h-5 w-5 text-orange-500" />
      case "term":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "class":
        return <School className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-center text-muted-foreground">No recent activities</p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {getActivityIcon(activity.type)}
            </div>
            <div>
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
