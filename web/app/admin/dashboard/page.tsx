"use client"

import { useState, useEffect } from "react"
import { Users, GraduationCap, School, BookOpen, Calendar, Bell, TrendingUp, TrendingDown } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AdminDashboardChart } from "@/components/admin/dashboard-chart"
import { AdminRecentActivity } from "@/components/admin/recent-activity"
import { AdminUpcomingEvents } from "@/components/admin/upcoming-events"

interface DashboardStats {
  teacherCount: number
  studentCount: number
  classCount: number
  subjectCount: number
  termCount: number
  noticeCount: number
  studentGrowth: number
  teacherGrowth: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    teacherCount: 0,
    studentCount: 0,
    classCount: 0,
    subjectCount: 0,
    termCount: 0,
    noticeCount: 0,
    studentGrowth: 0,
    teacherGrowth: 0,
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

        const response = await fetch("/api/admin/dashboard-stats", {
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
    <DashboardLayout title="Admin Dashboard" requiredRole="Admin">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Teachers card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.teacherCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.teacherGrowth >= 0 ? (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats.teacherGrowth}% from last month
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {Math.abs(stats.teacherGrowth)}% from last month
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Students card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.studentCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.studentGrowth >= 0 ? (
                <span className="flex items-center text-green-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats.studentGrowth}% from last month
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {Math.abs(stats.studentGrowth)}% from last month
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Classes card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.classCount}
            </div>
            <p className="text-xs text-muted-foreground">Across all terms</p>
          </CardContent>
        </Card>

        {/* Subjects card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.subjectCount}
            </div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        {/* Terms card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.termCount}
            </div>
            <p className="text-xs text-muted-foreground">Current academic year</p>
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
            <p className="text-xs text-muted-foreground">Published this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and activity */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Student Enrollment</CardTitle>
            <CardDescription>Monthly student enrollment for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDashboardChart />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest activities in your school</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminRecentActivity />
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
            <AdminUpcomingEvents />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
