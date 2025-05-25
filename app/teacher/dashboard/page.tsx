"use client"

import { useState, useEffect } from "react"
import { Users, BookOpen, Calendar, TrendingUp, Clock, Award, AlertCircle } from 'lucide-react'
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface TeacherDashboardData {
  teacher: {
    id: string
    name: string
    email: string
    class: {
      id: string
      sclassName: string
      students: Array<{
        id: string
        name: string
        rollNum: string
      }>
    }
    subject: {
      id: string
      subName: string
      subCode: string
    } | null
  }
  stats: {
    totalStudents: number
    attendanceStats: {
      totalRecords: number
      presentCount: number
      absentCount: number
      lateCount: number
    }
    examStats: {
      totalExams: number
      upcomingExams: number
      completedExams: number
    }
  }
  recentExams: Array<{
    id: string
    examName: string
    examType: string
    startDate: string
    endDate: string
    totalMarks: number
    subject: {
      subName: string
    }
    sclass: {
      sclassName: string
    }
    results: Array<{
      id: string
      marksObtained: number
      student: {
        name: string
      }
    }>
  }>
  recentAttendance: Array<{
    id: string
    date: string
    status: string
    student: {
      id: string
      name: string
      rollNum: string
    }
    sclass: {
      sclassName: string
    }
  }>
  classPerformance: Array<{
    examId: string
    examName: string
    subject: string | undefined
    totalStudents: number
    passedStudents: number
    passPercentage: number
    averageMarks: number
  }>
}

export default function TeacherDashboardPage() {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/teacher/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        throw new Error("Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getExamStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return { status: "Upcoming", color: "bg-blue-100 text-blue-800" }
    if (now >= start && now <= end) return { status: "Ongoing", color: "bg-yellow-100 text-yellow-800" }
    return { status: "Completed", color: "bg-green-100 text-green-800" }
  }

  const getAttendancePercentage = () => {
    if (!dashboardData) return 0
    const { attendanceStats } = dashboardData.stats
    if (attendanceStats.totalRecords === 0) return 0
    return ((attendanceStats.presentCount + attendanceStats.lateCount) / attendanceStats.totalRecords) * 100
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load dashboard data.</p>
        </div>
      </div>
    )
  }

  const { teacher, stats, recentExams, recentAttendance, classPerformance } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {teacher.name}! Here's an overview of your class and activities.
        </p>
      </div>

      {/* Teacher Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Teaching Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <p className="text-lg font-semibold">{teacher.class.sclassName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subject</p>
              <p className="text-lg font-semibold">
                {teacher.subject ? `${teacher.subject.subName} (${teacher.subject.subCode})` : "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <p className="text-lg font-semibold">{stats.totalStudents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">In your class</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAttendancePercentage().toFixed(1)}%</div>
            <Progress value={getAttendancePercentage()} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.examStats.totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {stats.examStats.upcomingExams} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classPerformance.length > 0
                ? (classPerformance.reduce((sum, perf) => sum + perf.passPercentage, 0) / classPerformance.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Pass rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Recent Exams</TabsTrigger>
          <TabsTrigger value="attendance">Recent Attendance</TabsTrigger>
          <TabsTrigger value="performance">Class Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exams</CardTitle>
              <CardDescription>Your latest examinations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExams.length > 0 ? (
                  recentExams.map((exam) => {
                    const { status, color } = getExamStatus(exam.startDate, exam.endDate)
                    return (
                      <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{exam.examName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exam.subject.subName} • {exam.examType} • {exam.totalMarks} marks
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exam.startDate), "MMM dd")} - {format(new Date(exam.endDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={color}>{status}</Badge>
                          <p className="text-sm text-muted-foreground">
                            {exam.results.length} submissions
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">No exams found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Latest attendance records you've marked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{record.student.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Roll: {record.student.rollNum} • {record.sclass.sclassName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge
                        className={
                          record.status === "Present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "Absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No attendance records found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Performance analysis of your exams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classPerformance.length > 0 ? (
                  classPerformance.map((performance) => (
                    <div key={performance.examId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{performance.examName}</h4>
                        <Badge variant="outline">{performance.subject}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Students</p>
                          <p className="font-medium">{performance.totalStudents}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Passed</p>
                          <p className="font-medium text-green-600">{performance.passedStudents}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pass Rate</p>
                          <p className={`font-medium ${getPerformanceColor(performance.passPercentage)}`}>
                            {performance.passPercentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Average Marks</p>
                          <p className="font-medium">{performance.averageMarks.toFixed(1)}</p>
                        </div>
                      </div>
                      <Progress value={performance.passPercentage} className="mt-3" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No performance data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
