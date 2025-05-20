"use client"

import { useState, useEffect } from "react"
import { Users, BookOpen, Calendar, CreditCard, Bell } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ParentWelcomeBanner } from "@/components/parent/welcome-banner"
import { ParentChildrenList } from "@/components/parent/children-list"
import { ParentRecentNotices } from "@/components/parent/recent-notices"
import { ParentUpcomingEvents } from "@/components/parent/upcoming-events"
import { ParentPaymentHistory } from "@/components/parent/payment-history"

interface DashboardStats {
  childrenCount: number
  totalSubjects: number
  pendingPayments: number
  upcomingEvents: number
  unreadNotices: number
}

export default function ParentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    childrenCount: 0,
    totalSubjects: 0,
    pendingPayments: 0,
    upcomingEvents: 0,
    unreadNotices: 0,
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

        const response = await fetch("/api/parent/dashboard-stats", {
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
    <DashboardLayout title="Parent Dashboard" requiredRole="Parent">
      {/* Welcome Banner */}
      <ParentWelcomeBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Children card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-green-200 dark:bg-green-700/30"></div>
              ) : (
                stats.childrenCount
              )}
            </div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Registered in school</p>
          </CardContent>
        </Card>

        {/* Subjects card */}
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-none shadow-md dark:from-teal-900/20 dark:to-teal-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <div className="rounded-full bg-teal-100 p-2 dark:bg-teal-800/30">
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-teal-200 dark:bg-teal-700/30"></div>
              ) : (
                stats.totalSubjects
              )}
            </div>
            <p className="text-xs text-teal-600/80 dark:text-teal-400/80">Across all children</p>
          </CardContent>
        </Card>

        {/* Upcoming Events card */}
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-none shadow-md dark:from-cyan-900/20 dark:to-cyan-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <div className="rounded-full bg-cyan-100 p-2 dark:bg-cyan-800/30">
              <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-cyan-200 dark:bg-cyan-700/30"></div>
              ) : (
                stats.upcomingEvents
              )}
            </div>
            <p className="text-xs text-cyan-600/80 dark:text-cyan-400/80">Next 30 days</p>
          </CardContent>
        </Card>

        {/* Payments card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-md dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-800/30">
              <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-emerald-200 dark:bg-emerald-700/30"></div>
              ) : (
                stats.pendingPayments
              )}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Due this month</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card className="bg-gradient-to-br from-lime-50 to-lime-100 border-none shadow-md dark:from-lime-900/20 dark:to-lime-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notices</CardTitle>
            <div className="rounded-full bg-lime-100 p-2 dark:bg-lime-800/30">
              <Bell className="h-4 w-4 text-lime-600 dark:text-lime-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-700 dark:text-lime-300">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-lime-200 dark:bg-lime-700/30"></div>
              ) : (
                stats.unreadNotices
              )}
            </div>
            <p className="text-xs text-lime-600/80 dark:text-lime-400/80">School announcements</p>
          </CardContent>
        </Card>
      </div>

      {/* Children list and payment history */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-md">
          <CardHeader>
            <CardTitle>My Children</CardTitle>
            <CardDescription>Overview of your children's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentChildrenList />
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-md">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentPaymentHistory />
          </CardContent>
        </Card>
      </div>

      {/* Recent notices and upcoming events */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Latest school announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentRecentNotices />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>School events and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentUpcomingEvents />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
