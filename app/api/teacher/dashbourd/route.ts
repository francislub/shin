"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalClasses: number
  totalSubjects: number
  totalStudents: number
  totalAttendanceRecords: number
  averageAttendanceRate: number
  upcomingExams: {
    id: string
    name: string
    date: string
    type: string
    className: string
    subjectName: string
    daysUntil: number
  }[]
  recentAttendance: {
    id: string
    date: string
    className: string
    subjectName: string
    presentCount: number
    absentCount: number
    lateCount: number
    totalStudents: number
    attendanceRate: number
  }[]
  classesTeaching: {
    id: string
    name: string
    section: string
    studentCount: number
    subjectsCount: number
    subjects: {
      id: string
      name: string
      code: string
    }[]
  }[]
  teacherInfo: {
    id: string
    name: string
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/teacher/dashboard')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setStats(data)
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

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

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-500">Error Loading Dashboard</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {error}. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No dashboard data was found.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Dashboard
      </h1>
      <p className="text-muted-foreground">Here&apos;s an overview of your classes, attendance, and upcoming exams.</p>

      <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendanceRecords}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-8 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {stats.upcomingExams.length === 0 ? (
                <p className="text-muted-foreground">No upcoming exams.</p>
              ) : (
                stats.upcomingExams.map((exam) => (
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
                    <p className="mt-1 text-xs text-muted-foreground">{exam.className}</p>
                    <p className="text-xs text-muted-foreground">{exam.subjectName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        <CalendarDays className="mr-1 inline h-3 w-3" />
                        {formatDate(exam.date)}
                      </p>
                      <span className="text-xs font-medium text-orange-600">
                        {exam.daysUntil === 0 ? 'Today' : exam.daysUntil === 1 ? 'Tomorrow' : `${exam.daysUntil} days`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {stats.recentAttendance.length === 0 ? (
                <p className="text-muted-foreground">No recent attendance records.</p>
              ) : (
                stats.recentAttendance.map((record) => (
                  <div key={record.id} className="rounded-lg border p-3">
                    <p className="font-medium">{record.className}</p>
                    <p className="text-sm text-muted-foreground">{record.subjectName} - {formatDate(record.date)}</p>
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
                        <p className="text-xs text-muted-foreground">Late</p>
                        <p className="font-medium text-yellow-600">{record.lateCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="font-medium text-blue-600">{record.attendanceRate}%</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/attendance`)}>
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage