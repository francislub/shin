"use client"

import { useState, useEffect } from "react"
import { Users, GraduationCap, School, BookOpen, Calendar, Bell, TrendingUp, TrendingDown } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AdminDashboardChart } from "@/components/admin/dashboard-chart"
import { AdminRecentActivity } from "@/components/admin/recent-activity"
import { AdminUpcomingEvents } from "@/components/admin/upcoming-events"
import { WelcomeBanner } from "@/components/admin/welcome-banner"

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
        setIsLoading(true)
        const token = localStorage.getItem("token")

        if (!token) {
          toast({
            title: "Authentication error",
            description: "Please log in again to continue",
            variant: "destructive",
          })
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
          const errorData = await response.json()
          toast({
            title: "Failed to load dashboard data",
            description: errorData.error || "Please try again later",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Dashboard stats error:", error)
        toast({
          title: "Error loading dashboard",
          description: "Could not connect to the server. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [toast])

  return (
    <DashboardLayout title="Admin Dashboard" requiredRole="Admin">
      {/* Welcome Banner */}
      <WelcomeBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Teachers card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-50 to-blue-100 shadow-md dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-blue-200 dark:bg-blue-700/30"></div>
              ) : (
                stats.teacherCount
              )}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              {stats.teacherGrowth >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats.teacherGrowth}% from last month
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {Math.abs(stats.teacherGrowth)}% from last month
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Students card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-purple-50 to-purple-100 shadow-md dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-800/30">
              <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-purple-200 dark:bg-purple-700/30"></div>
              ) : (
                stats.studentCount
              )}
            </div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
              {stats.studentGrowth >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stats.studentGrowth}% from last month
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {Math.abs(stats.studentGrowth)}% from last month
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Classes card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-green-50 to-green-100 shadow-md dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
              <School className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-green-200 dark:bg-green-700/30"></div>
              ) : (
                stats.classCount
              )}
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Across all terms</p>
          </CardContent>
        </Card>

        {/* Subjects card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-50 to-amber-100 shadow-md dark:from-amber-900/20 dark:to-amber-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-800/30">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-amber-200 dark:bg-amber-700/30"></div>
              ) : (
                stats.subjectCount
              )}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Across all classes</p>
          </CardContent>
        </Card>

        {/* Terms card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-md dark:from-cyan-900/20 dark:to-cyan-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
            <div className="rounded-full bg-cyan-100 p-2 dark:bg-cyan-800/30">
              <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-cyan-200 dark:bg-cyan-700/30"></div>
              ) : (
                stats.termCount
              )}
            </div>
            <p className="text-xs text-cyan-600/80 dark:text-cyan-400/80">Current academic year</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-rose-50 to-rose-100 shadow-md dark:from-rose-900/20 dark:to-rose-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
            <div className="rounded-full bg-rose-100 p-2 dark:bg-rose-800/30">
              <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-rose-200 dark:bg-rose-700/30"></div>
              ) : (
                stats.noticeCount
              )}
            </div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Published this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and activity */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-md">
          <CardHeader>
            <CardTitle>Student Enrollment</CardTitle>
            <CardDescription>Monthly student enrollment for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDashboardChart />
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-md">
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
      <div className="mt-6">
        <Card className="border-none shadow-md">
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
