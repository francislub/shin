"use client"

import { useState, useEffect } from "react"
import { GraduationCap, BookOpen, UserCheck, ClipboardList, Bell } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { TeacherAttendanceChart } from "@/components/teacher/attendance-chart"
import { TeacherRecentActivity } from "@/components/teacher/recent-activity"
import { TeacherUpcomingEvents } from "@/components/teacher/upcoming-events"

interface DashboardStats {
  studentCount: number
  subjectCount: number
  attendanceToday: number
  examCount: number
  noticeCount: number
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    studentCount: 0,
    subjectCount: 0,
    attendanceToday: 0,
    examCount: 0,
    noticeCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/teacher/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch dashboard statistics",
          })
        }
      } catch (error) {
        console.error("Dashboard stats error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching dashboard statistics",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [toast])

  return (
    <DashboardLayout title="Teacher Dashboard" requiredRole="Teacher">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Students card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.studentCount}
            </div>
            <p className="text-xs text-muted-foreground">In your class</p>
          </CardContent>
        </Card>

        {/* Subjects card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.subjectCount}
            </div>
            <p className="text-xs text-muted-foreground">Teaching this term</p>
          </CardContent>
        </Card>

        {/* Attendance card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : (
                `${stats.attendanceToday}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Present students</p>
          </CardContent>
        </Card>

        {/* Exams card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.examCount}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.noticeCount}
            </div>
            <p className="text-xs text-muted-foreground">Unread notices</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and activity */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Weekly attendance for your class</CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherAttendanceChart />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest activities in your class</CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherRecentActivity />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events and deadlines for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherUpcomingEvents />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
