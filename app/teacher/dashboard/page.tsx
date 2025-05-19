"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, GraduationCap, Users, Clock, CalendarDays, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalClasses: number
  totalSubjects: number
  totalStudents: number
  upcomingExams: {
    id: string
    name: string
    date: string
    type: string
  }[]
  recentAttendance: {
    id: string
    date: string
    className: string
    subjectName: string
    presentCount: number
    absentCount: number
    totalStudents: number
  }[]
  classesTeaching: {
    id: string
    name: string
    section: string
    studentCount: number
  }[]
}

export default function TeacherDashboardPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchDashboardStats()
    }
  }, [token])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teachers/${user?.id}/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Loading Dashboard</h3>
          <p className="mt-2 text-sm text-muted-foreground">Please wait while we load your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.firstName}!</p>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Classes you are teaching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Subjects you are teaching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Students in your classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingExams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Exams in the next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Classes You Teach</CardTitle>
            <CardDescription>Overview of classes and student counts</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.classesTeaching && stats.classesTeaching.length > 0 ? (
              <div className="space-y-4">
                {stats.classesTeaching.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {cls.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {cls.name} - {cls.section}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Users className="mr-1 inline h-3 w-3" />
                          {cls.studentCount} students
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/classes`)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Classes Assigned</h3>
                <p className="mt-2 text-sm text-muted-foreground">You haven't been assigned to any classes yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Exams scheduled in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingExams && stats.upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingExams.map((exam) => (
                  <div key={exam.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{exam.name}</p>
                      <Badge variant="outline">{exam.type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <CalendarDays className="mr-1 inline h-3 w-3" />
                      {formatDate(exam.date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Upcoming Exams</h3>
                <p className="mt-2 text-sm text-muted-foreground">There are no exams scheduled in the next 30 days.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Your most recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
            <div className="space-y-4">
              {stats.recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {record.className} - {record.subjectName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(record.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Present</p>
                      <p className="font-medium text-green-600">{record.presentCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Absent</p>
                      <p className="font-medium text-red-600">{record.absentCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-medium">{record.totalStudents}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/attendance`)}>
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-center">
              <Clock className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Attendance Records</h3>
              <p className="mt-2 text-sm text-muted-foreground">You haven't recorded any attendance yet.</p>
              <Button className="mt-4" onClick={() => router.push(`/teacher/attendance`)}>
                Record Attendance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
