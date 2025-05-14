"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ParentChildrenList } from "@/components/parent/children-list"
import { ParentPaymentHistory } from "@/components/parent/payment-history"
import { ParentUpcomingEvents } from "@/components/parent/upcoming-events"
import { ParentRecentNotices } from "@/components/parent/recent-notices"
import { GraduationCap, CreditCard, Calendar, Bell } from "lucide-react"

interface DashboardStats {
  childrenCount: number
  pendingPayments: number
  upcomingEvents: number
  unreadNotices: number
}

export default function ParentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    childrenCount: 0,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Children card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.childrenCount}
            </div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        {/* Payments card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">Due this month</p>
          </CardContent>
        </Card>

        {/* Events card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.upcomingEvents}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        {/* Notices card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notices</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-16 animate-pulse rounded bg-muted"></div> : stats.unreadNotices}
            </div>
            <p className="text-xs text-muted-foreground">School announcements</p>
          </CardContent>
        </Card>
      </div>

      {/* Children list and payment history */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Children</CardTitle>
            <CardDescription>List of your children enrolled in the school</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentChildrenList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentPaymentHistory />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events and notices */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>School events in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentUpcomingEvents />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Latest announcements from the school</CardDescription>
          </CardHeader>
          <CardContent>
            <ParentRecentNotices />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
