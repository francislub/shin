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
import { TeacherWelcomeBanner } from "@/components/teacher/welcome-banner"

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

  // if (loading) {
  //   return (
  //     <div className="flex h-[600px] items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
  //         <h3 className="mt-4 text-lg font-semibold">Loading Dashboard</h3>
  //         <p className="mt-2 text-sm text-muted-foreground">Please wait while we load your dashboard...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <TeacherWelcomeBanner />

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-none shadow-md dark:from-teal-900/20 dark:to-teal-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <div className="rounded-full bg-teal-100 p-2 dark:bg-teal-800/30">
              <GraduationCap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{stats?.totalClasses || 0}</div>
            <p className="text-xs text-teal-600/80 dark:text-teal-400/80">Classes you are teaching</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-md dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-800/30">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.totalSubjects || 0}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Subjects you are teaching</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-none shadow-md dark:from-cyan-900/20 dark:to-cyan-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="rounded-full bg-cyan-100 p-2 dark:bg-cyan-800/30">
              <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-cyan-600/80 dark:text-cyan-400/80">Students in your classes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-none shadow-md dark:from-sky-900/20 dark:to-sky-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-800/30">
              <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">{stats?.upcomingExams?.length || 0}</div>
            <p className="text-xs text-sky-600/80 dark:text-sky-400/80">Exams in the next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle>Classes You Teach</CardTitle>
            <CardDescription>Overview of classes and student counts</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.classesTeaching && stats.classesTeaching.length > 0 ? (
              <div className="space-y-4">
                {stats.classesTeaching.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200">
                        <AvatarFallback>{cls.name.charAt(0)}</AvatarFallback>
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

        <Card className="col-span-1 border-none shadow-md">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Exams scheduled in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingExams && stats.upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-lg border p-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{exam.name}</p>
                      <Badge
                        variant="outline"
                        className="bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50"
                      >
                        {exam.type}
                      </Badge>
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

      <Card className="border-none shadow-md">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/10 dark:to-teal-900/10"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
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
