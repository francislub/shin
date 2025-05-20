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
import { StudentWelcomeBanner } from "@/components/student/welcome-banner"

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
      {/* Welcome Banner */}
      <StudentWelcomeBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Subjects card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800/30">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-blue-200 dark:bg-blue-700/30"></div>
              ) : (
                stats.subjectCount
              )}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Enrolled this term</p>
          </CardContent>
        </Card>

        {/* Attendance card */}
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-none shadow-md dark:from-violet-900/20 dark:to-violet-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <div className="rounded-full bg-violet-100 p-2 dark:bg-violet-800/30">
              <UserCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-violet-200 dark:bg-violet-700/30"></div>
              ) : (
                `${stats.attendancePercentage}%`
              )}
            </div>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/80">Current term</p>
          </CardContent>
        </Card>

        {/* Average Grade card */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-none shadow-md dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-800/30">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-indigo-200 dark:bg-indigo-700/30"></div>
              ) : (
                stats.averageGrade
              )}
            </div>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">Current term</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-none shadow-md dark:from-fuchsia-900/20 dark:to-fuchsia-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notices</CardTitle>
            <div className="rounded-full bg-fuchsia-100 p-2 dark:bg-fuchsia-800/30">
              <Bell className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-fuchsia-200 dark:bg-fuchsia-700/30"></div>
              ) : (
                stats.noticeCount
              )}
            </div>
            <p className="text-xs text-fuchsia-600/80 dark:text-fuchsia-400/80">Unread notices</p>
          </CardContent>
        </Card>

        {/* Complaints card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-800/30">
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-purple-200 dark:bg-purple-700/30"></div>
              ) : (
                stats.complaintCount
              )}
            </div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Active complaints</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and activity */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-md">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Your attendance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentAttendanceChart />
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-md">
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
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest activities</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentRecentActivity />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
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
