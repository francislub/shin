"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Event {
  id: string
  title: string
  date: string
  type: "meeting" | "event" | "academic" | "exam" | "training"
  description: string
}

// Mock data to use when API fails
const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Parent-Teacher Meeting",
    date: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: "meeting",
    description: "Quarterly parent-teacher meeting for all classes",
  },
  {
    id: "2",
    title: "Annual Sports Day",
    date: new Date(new Date().getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    type: "event",
    description: "Annual sports competition for all students",
  },
  {
    id: "3",
    title: "Science Exhibition",
    date: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    type: "academic",
    description: "Science projects exhibition for classes 8-12",
  },
  {
    id: "4",
    title: "Term End Exams",
    date: new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    type: "exam",
    description: "End of term examinations begin for all classes",
  },
  {
    id: "5",
    title: "Teacher Training Workshop",
    date: new Date(new Date().getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    type: "training",
    description: "Professional development workshop for all teaching staff",
  },
];

export function AdminUpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          if (isMounted) {
            setEvents(MOCK_EVENTS);
            setIsLoading(false);
          }
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch("/api/admin/upcoming-events", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (isMounted) {
              setEvents(data);
            }
          } else {
            console.error("Error fetching events:", response.status);
            if (isMounted) {
              setEvents(MOCK_EVENTS);
            }
          }
        } catch (fetchError) {
          console.error("Events fetch error:", fetchError);
          if (isMounted) {
            setEvents(MOCK_EVENTS);
          }
        }
      } catch (error) {
        console.error("Error in events:", error);
        if (isMounted) {
          setEvents(MOCK_EVENTS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case "meeting":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Meeting</Badge>
      case "event":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Event</Badge>
      case "academic":
        return <Badge className="bg-green-500 hover:bg-green-600">Academic</Badge>
      case "exam":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Exam</Badge>
      case "training":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Training</Badge>
      default:
        return <Badge>Other</Badge>
    }
  }

  const getDaysRemaining = (dateString: string) => {
    const now = new Date()
    const eventDate = new Date(dateString)
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    return `In ${diffDays} days`
  }

  if (isLoading) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div>
            <Calendar className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
            <p className="mt-1 text-sm text-gray-500">Events will appear here as they are scheduled.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{event.title}</h3>
                {getEventBadge(event.type)}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{formatDate(event.date)}</span>
                <span className="mx-2">•</span>
                <Clock className="mr-1 h-4 w-4" />
                <span className="font-medium text-primary">{getDaysRemaining(event.date)}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{event.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
