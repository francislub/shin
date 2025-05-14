"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

interface Event {
  id: string
  title: string
  date: string
  type: "exam" | "holiday" | "meeting" | "activity"
}

export function ParentUpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/parent/upcoming-events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setEvents(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch upcoming events",
          })
        }
      } catch (error) {
        console.error("Upcoming events error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching upcoming events",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case "exam":
        return <Badge className="bg-red-500 hover:bg-red-600">Exam</Badge>
      case "holiday":
        return <Badge className="bg-green-500 hover:bg-green-600">Holiday</Badge>
      case "meeting":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Meeting</Badge>
      case "activity":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Activity</Badge>
      default:
        return <Badge>Event</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
              <div className="h-6 w-full animate-pulse rounded bg-muted"></div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-pulse rounded-full bg-muted"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No upcoming events</p>
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border p-4">
          <div className="space-y-2">
            <div>{getEventBadge(event.type)}</div>
            <h3 className="font-medium">{event.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{formatDate(event.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
