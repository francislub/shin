"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, FileText } from "lucide-react"

interface Exam {
  id: string
  subject: string
  title: string
  date: string
  time: string
  duration: string
  location: string
  type: "mid" | "final" | "quiz" | "assignment"
  status: "upcoming" | "completed" | "missed"
}

export default function StudentExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/student/exams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setExams(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch exam information",
          })
        }
      } catch (error) {
        console.error("Exams error:", error)
        // Fallback to sample data if API fails
        setExams([
          {
            id: "1",
            subject: "Mathematics",
            title: "Mid-term Examination",
            date: "2023-11-15",
            time: "10:00 AM",
            duration: "2 hours",
            location: "Hall A",
            type: "mid",
            status: "upcoming",
          },
          {
            id: "2",
            subject: "English",
            title: "Essay Assignment",
            date: "2023-11-10",
            time: "11:30 AM",
            duration: "1 hour",
            location: "Room 101",
            type: "assignment",
            status: "upcoming",
          },
          {
            id: "3",
            subject: "Science",
            title: "Lab Quiz",
            date: "2023-10-25",
            time: "09:00 AM",
            duration: "30 minutes",
            location: "Lab 3",
            type: "quiz",
            status: "completed",
          },
          {
            id: "4",
            subject: "History",
            title: "Term Paper Submission",
            date: "2023-10-20",
            time: "02:00 PM",
            duration: "N/A",
            location: "Online",
            type: "assignment",
            status: "completed",
          },
          {
            id: "5",
            subject: "Geography",
            title: "Pop Quiz",
            date: "2023-10-15",
            time: "11:00 AM",
            duration: "20 minutes",
            location: "Room 203",
            type: "quiz",
            status: "missed",
          },
          {
            id: "6",
            subject: "Computer Science",
            title: "Final Project",
            date: "2023-12-05",
            time: "01:00 PM",
            duration: "3 hours",
            location: "Computer Lab",
            type: "final",
            status: "upcoming",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case "missed":
        return <Badge className="bg-red-500 hover:bg-red-600">Missed</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "mid":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Mid-term
          </Badge>
        )
      case "final":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Final
          </Badge>
        )
      case "quiz":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            Quiz
          </Badge>
        )
      case "assignment":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Assignment
          </Badge>
        )
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const upcomingExams = exams.filter((exam) => exam.status === "upcoming")
  const pastExams = exams.filter((exam) => exam.status === "completed" || exam.status === "missed")

  return (
    <DashboardLayout title="Exams & Assignments" requiredRole="Student">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              // Loading skeletons
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-3/4 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                      </div>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))
            ) : upcomingExams.length === 0 ? (
              <div className="col-span-full flex justify-center p-8">
                <p className="text-muted-foreground">No upcoming exams or assignments.</p>
              </div>
            ) : (
              upcomingExams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{exam.title}</CardTitle>
                      {getTypeBadge(exam.type)}
                    </div>
                    <CardDescription>{exam.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {exam.time} ({exam.duration})
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Location: {exam.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              // Loading skeletons
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-3/4 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                      </div>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))
            ) : pastExams.length === 0 ? (
              <div className="col-span-full flex justify-center p-8">
                <p className="text-muted-foreground">No past exams or assignments.</p>
              </div>
            ) : (
              pastExams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{exam.title}</CardTitle>
                      {getStatusBadge(exam.status)}
                    </div>
                    <CardDescription>{exam.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>
                        {exam.time} ({exam.duration})
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Location: {exam.location}</span>
                    </div>
                    <div className="flex items-center">{getTypeBadge(exam.type)}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
