"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
  teacher: {
    id: string
    name: string
    photo?: string
  }
  schedule: {
    day: string
    startTime: string
    endTime: string
  }[]
  materials?: {
    id: string
    title: string
    type: string
    url: string
  }[]
}

export function ParentChildSubjects({ childId }: { childId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch(`/api/students/${childId}/subjects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch subjects",
          })
        }
      } catch (error) {
        console.error("Fetch subjects error:", error)
        // Fallback to sample data if API fails
        setSubjects([
          {
            id: "1",
            name: "Mathematics",
            description: "Fundamental mathematics including algebra, geometry, and arithmetic.",
            teacher: {
              id: "t1",
              name: "Mr. Johnson",
              photo: "/placeholder.svg",
            },
            schedule: [
              {
                day: "Monday",
                startTime: "09:00",
                endTime: "10:30",
              },
              {
                day: "Wednesday",
                startTime: "09:00",
                endTime: "10:30",
              },
            ],
            materials: [
              {
                id: "m1",
                title: "Algebra Basics",
                type: "PDF",
                url: "#",
              },
              {
                id: "m2",
                title: "Geometry Formulas",
                type: "PDF",
                url: "#",
              },
            ],
          },
          {
            id: "2",
            name: "English",
            description: "Language arts, grammar, literature, and composition.",
            teacher: {
              id: "t2",
              name: "Mrs. Smith",
              photo: "/placeholder.svg",
            },
            schedule: [
              {
                day: "Tuesday",
                startTime: "11:00",
                endTime: "12:30",
              },
              {
                day: "Thursday",
                startTime: "11:00",
                endTime: "12:30",
              },
            ],
            materials: [
              {
                id: "m3",
                title: "Grammar Rules",
                type: "PDF",
                url: "#",
              },
              {
                id: "m4",
                title: "Essay Writing Guide",
                type: "PDF",
                url: "#",
              },
            ],
          },
          {
            id: "3",
            name: "Science",
            description: "Basic principles of physics, chemistry, and biology.",
            teacher: {
              id: "t3",
              name: "Dr. Brown",
              photo: "/placeholder.svg",
            },
            schedule: [
              {
                day: "Monday",
                startTime: "13:00",
                endTime: "14:30",
              },
              {
                day: "Friday",
                startTime: "09:00",
                endTime: "10:30",
              },
            ],
            materials: [
              {
                id: "m5",
                title: "Scientific Method",
                type: "PDF",
                url: "#",
              },
              {
                id: "m6",
                title: "Periodic Table",
                type: "PDF",
                url: "#",
              },
            ],
          },
          {
            id: "4",
            name: "Social Studies",
            description: "History, geography, and social sciences.",
            teacher: {
              id: "t4",
              name: "Ms. Davis",
              photo: "/placeholder.svg",
            },
            schedule: [
              {
                day: "Tuesday",
                startTime: "09:00",
                endTime: "10:30",
              },
              {
                day: "Thursday",
                startTime: "09:00",
                endTime: "10:30",
              },
            ],
            materials: [
              {
                id: "m7",
                title: "World History Timeline",
                type: "PDF",
                url: "#",
              },
              {
                id: "m8",
                title: "Map Reading Guide",
                type: "PDF",
                url: "#",
              },
            ],
          },
          {
            id: "5",
            name: "Art",
            description: "Visual arts, drawing, and creative expression.",
            teacher: {
              id: "t5",
              name: "Mr. Wilson",
              photo: "/placeholder.svg",
            },
            schedule: [
              {
                day: "Wednesday",
                startTime: "13:00",
                endTime: "14:30",
              },
            ],
            materials: [
              {
                id: "m9",
                title: "Color Theory",
                type: "PDF",
                url: "#",
              },
              {
                id: "m10",
                title: "Drawing Techniques",
                type: "PDF",
                url: "#",
              },
            ],
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [childId, toast])

  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        // Loading skeletons
        Array(3)
          .fill(0)
          .map((_, index) => <div key={index} className="h-40 w-full animate-pulse rounded bg-muted"></div>)
      ) : subjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No subjects found.</p>
        </div>
      ) : (
        subjects.map((subject) => (
          <Card key={subject.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/4">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">{subject.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{subject.description}</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={subject.teacher.photo || "/placeholder.svg"} />
                      <AvatarFallback>{subject.teacher.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{subject.teacher.name}</p>
                      <p className="text-xs text-muted-foreground">Teacher</p>
                    </div>
                  </div>
                </div>

                <div className="md:w-1/4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </h4>
                  <div className="space-y-2">
                    {subject.schedule.map((schedule, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{schedule.day}:</span> {formatTime(schedule.startTime)} -{" "}
                        {formatTime(schedule.endTime)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:w-1/2">
                  <h4 className="text-sm font-medium mb-3">Learning Materials</h4>
                  {subject.materials && subject.materials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subject.materials.map((material) => (
                        <div key={material.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{material.title}</p>
                              <p className="text-xs text-muted-foreground">Resource</p>
                            </div>
                            <Badge variant="outline">{material.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No learning materials available.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
