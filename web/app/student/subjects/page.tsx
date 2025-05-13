"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Clock, User } from "lucide-react"

interface Subject {
  id: string
  name: string
  code: string
  teacher: string
  sessions: string
  description?: string
}

export default function StudentSubjects() {
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

        const response = await fetch("/api/student/subjects", {
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
        console.error("Subjects error:", error)
        // Fallback to sample data if API fails
        setSubjects([
          {
            id: "1",
            name: "Mathematics",
            code: "MATH101",
            teacher: "Dr. John Smith",
            sessions: "Mon, Wed 10:00-11:30",
            description: "Introduction to calculus, algebra, and geometry.",
          },
          {
            id: "2",
            name: "English Literature",
            code: "ENG201",
            teacher: "Prof. Sarah Johnson",
            sessions: "Tue, Thu 13:00-14:30",
            description: "Study of classic and contemporary literature.",
          },
          {
            id: "3",
            name: "Physics",
            code: "PHY101",
            teacher: "Dr. Michael Brown",
            sessions: "Mon, Fri 14:00-15:30",
            description: "Fundamentals of mechanics, thermodynamics, and electromagnetism.",
          },
          {
            id: "4",
            name: "Chemistry",
            code: "CHEM101",
            teacher: "Dr. Emily Davis",
            sessions: "Wed, Fri 09:00-10:30",
            description: "Introduction to atomic structure, chemical bonding, and reactions.",
          },
          {
            id: "5",
            name: "Computer Science",
            code: "CS101",
            teacher: "Prof. Robert Wilson",
            sessions: "Tue, Thu 10:00-11:30",
            description: "Introduction to programming, algorithms, and data structures.",
          },
          {
            id: "6",
            name: "History",
            code: "HIST101",
            teacher: "Dr. Patricia Miller",
            sessions: "Mon, Wed 13:00-14:30",
            description: "Survey of world history from ancient civilizations to modern times.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [toast])

  return (
    <DashboardLayout title="My Subjects" requiredRole="Student">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Subjects</TabsTrigger>
          <TabsTrigger value="today">Today's Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Loading skeletons
              Array(6)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-3 w-full bg-primary/10"></div>
                    <CardHeader>
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted mb-2"></div>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))
            ) : subjects.length === 0 ? (
              <div className="col-span-full flex justify-center p-8">
                <p className="text-muted-foreground">No subjects found for this term.</p>
              </div>
            ) : (
              subjects.map((subject) => (
                <Card key={subject.id} className="overflow-hidden">
                  <div className="h-3 w-full bg-primary"></div>
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>{subject.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{subject.teacher}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{subject.sessions}</span>
                    </div>
                    {subject.description && (
                      <div className="text-sm text-muted-foreground">
                        <p>{subject.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="today">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? // Loading skeletons
                Array(2)
                  .fill(0)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-3 w-full bg-primary/10"></div>
                      <CardHeader>
                        <div className="h-6 w-3/4 animate-pulse rounded bg-muted mb-2"></div>
                        <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                        <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                      </CardContent>
                    </Card>
                  ))
              : // Filter subjects for today based on the current day
                subjects
                  .filter((subject) => {
                    const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
                    return subject.sessions.toLowerCase().includes(today)
                  })
                  .map((subject) => (
                    <Card key={subject.id} className="overflow-hidden">
                      <div className="h-3 w-full bg-primary"></div>
                      <CardHeader>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>{subject.code}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{subject.teacher}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{subject.sessions}</span>
                        </div>
                        {subject.description && (
                          <div className="text-sm text-muted-foreground">
                            <p>{subject.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
            {!isLoading &&
              subjects.filter((subject) => {
                const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
                return subject.sessions.toLowerCase().includes(today)
              }).length === 0 && (
                <div className="col-span-full flex justify-center p-8">
                  <p className="text-muted-foreground">No classes scheduled for today.</p>
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
