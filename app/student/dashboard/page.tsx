"use client"

import { useState, useEffect } from "react"
import { BookOpen, UserCheck, Award, Bell, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { StudentAttendanceChart } from "@/components/student/attendance-chart"
import { StudentGradeChart } from "@/components/student/grade-chart"
import { StudentRecentActivity } from "@/components/student/recent-activity"
import { StudentUpcomingEvents } from "@/components/student/upcoming-events"

interface DashboardStats {
  subjectCount: number
  attendancePercentage: number
  averageGrade: string
  noticeCount: number
  complaintCount: number
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    subjectCount: 0,
    attendancePercentage: 0,
    averageGrade: "-",
    noticeCount: 0,
    complaintCount: 0,
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

        const response = await fetch("/api/student/dashboard-stats", {
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
    <DashboardLayout title="Student Dashboard" requiredRole="Student">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-xs text-muted-foreground">Enrolled this term</p>
          </CardContent>
        </Card>

        {/* Attendance card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : (
                `${stats.attendancePercentage}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current term</p>
          </CardContent>
        </Card>

        {/* Average Grade card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.averageGrade}
            </div>
            <p className="text-xs text-muted-foreground">Current term</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notices</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.noticeCount}
            </div>
            <p className="text-xs text-muted-foreground">Unread notices</p>
          </CardContent>
        </Card>

        {/* Complaints card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.complaintCount}
            </div>
            <p className="text-xs text-muted-foreground">Active complaints</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and activity */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Your attendance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentAttendanceChart />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Your grades by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentGradeChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent activity and upcoming events */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest activities</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentRecentActivity />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events and deadlines for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentUpcomingEvents />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
