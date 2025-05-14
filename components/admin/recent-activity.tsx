"use client"

import { useEffect, useState } from "react"
import { User, BookOpen, Bell, Calendar, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Activity {
  id: string
  type: "student" | "teacher" | "admin" | "parent" | "system"
  action: string
  name: string
  timestamp: string
  details: string
}

// Mock data to use when API fails
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    type: "student",
    action: "registered",
    name: "John Smith",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: "New student registered for Class 10A",
  },
  {
    id: "2",
    type: "teacher",
    action: "updated",
    name: "Sarah Johnson",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    details: "Updated class schedule for Mathematics",
  },
  {
    id: "3",
    type: "admin",
    action: "created",
    name: "Admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    details: "Created new notice for upcoming parent-teacher meeting",
  },
  {
    id: "4",
    type: "parent",
    action: "submitted",
    name: "Robert Davis",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    details: "Submitted leave application for student Emily Davis",
  },
  {
    id: "5",
    type: "system",
    action: "generated",
    name: "System",
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    details: "Generated monthly attendance reports for all classes",
  },
];

export function AdminRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          if (isMounted) {
            setActivities(MOCK_ACTIVITIES);
            setIsLoading(false);
          }
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch("/api/admin/recent-activities", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (isMounted) {
              setActivities(data);
            }
          } else {
            console.error("Error fetching activities:", response.status);
            if (isMounted) {
              setActivities(MOCK_ACTIVITIES);
            }
          }
        } catch (fetchError) {
          console.error("Activities fetch error:", fetchError);
          if (isMounted) {
            setActivities(MOCK_ACTIVITIES);
          }
        }
      } catch (error) {
        console.error("Error in activities:", error);
        if (isMounted) {
          setActivities(MOCK_ACTIVITIES);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchActivities();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffMs = now.getTime() - activityTime.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hr ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "student":
        return <User className="h-4 w-4 text-blue-500" />
      case "teacher":
        return <BookOpen className="h-4 w-4 text-purple-500" />
      case "admin":
        return <User className="h-4 w-4 text-amber-500" />
      case "parent":
        return <User className="h-4 w-4 text-green-500" />
      case "system":
        return <Bell className="h-4 w-4 text-gray-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getAvatarColor = (type: string) => {
    switch (type) {
      case "student":
        return "bg-blue-100 text-blue-500"
      case "teacher":
        return "bg-purple-100 text-purple-500"
      case "admin":
        return "bg-amber-100 text-amber-500"
      case "parent":
        return "bg-green-100 text-green-500"
      case "system":
        return "bg-gray-100 text-gray-500"
      default:
        return "bg-gray-100 text-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div>
            <Calendar className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activities</h3>
            <p className="mt-1 text-sm text-gray-500">Activities will appear here as they happen.</p>
          </div>
        </div>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <Avatar className={`h-8 w-8 ${getAvatarColor(activity.type)}`}>
              <AvatarFallback>{getActivityIcon(activity.type)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  <span className="font-semibold">{activity.name}</span> {activity.action}{" "}
                  {activity.type === "system" ? "" : activity.type === "admin" ? "as admin" : `as ${activity.type}`}
                </p>
                <span className="flex items-center text-xs text-gray-500">
                  <Clock className="mr-1 h-3 w-3" />
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-500">{activity.details}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
