"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Calendar, Bell } from "lucide-react"

interface Notice {
  id: string
  title: string
  content: string
  date: string
  isRead: boolean
  category: "academic" | "general" | "important"
}

export function ParentRecentNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/parent/notices", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setNotices(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch notices",
          })
        }
      } catch (error) {
        console.error("Notices error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching notices",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "academic":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Academic</Badge>
      case "general":
        return <Badge className="bg-gray-500 hover:bg-gray-600">General</Badge>
      case "important":
        return <Badge className="bg-red-500 hover:bg-red-600">Important</Badge>
      default:
        return <Badge>Other</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted"></div>
                <div className="h-5 w-16 animate-pulse rounded bg-muted"></div>
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notices.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No notices found</p>
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <div key={notice.id} className={`rounded-lg border p-4 ${!notice.isRead ? "border-l-4 border-l-primary" : ""}`}>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{notice.title}</h3>
              {getCategoryBadge(notice.category)}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{formatDate(notice.date)}</span>
              {!notice.isRead && (
                <span className="ml-2 flex items-center text-primary">
                  <Bell className="mr-1 h-3 w-3" />
                  New
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
