"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, Download, AlertTriangle, CheckCircle2, PieChart, BarChart4 } from "lucide-react"
import { Chart } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

export default function AIAttendanceInsights() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const { toast } = useToast()

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in again to continue.",
            variant: "destructive",
          })
          return
        }

        const response = await fetch("/api/classes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch classes")
        }

        const data = await response.json()
        setClasses(data)
      } catch (error) {
        console.error("Error fetching classes:", error)
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [toast])

  // Function to analyze attendance data
  const analyzeAttendance = async () => {
    setAnalyzing(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/ai/attendance-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: localStorage.getItem("schoolId"),
          classId: selectedClass || undefined,
          period: selectedPeriod,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze attendance data")
      }

      const data = await response.json()
      setAttendanceData(data.attendanceData)
      setAnalysis(data.analysis)

      toast({
        title: "Analysis Complete",
        description: "Attendance data has been analyzed successfully.",
      })
    } catch (error) {
      console.error("Error analyzing attendance:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze attendance data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Prepare chart data for attendance status distribution
  const getAttendanceStatusData = () => {
    if (!attendanceData) return null

    // Count attendance statuses across all students
    const statusCounts: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Other: 0 }

    attendanceData.forEach((student: any) => {
      statusCounts.Present += student.summary.present
      statusCounts.Absent += student.summary.absent
      statusCounts.Late += student.summary.late
      statusCounts.Other += student.summary.other
    })

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: "Attendance Status",
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  // Prepare chart data for at-risk students
  const getAtRiskStudentsData = () => {
    if (!attendanceData) return null

    // Sort students by attendance rate (ascending)
    const sortedStudents = [...attendanceData].sort((a, b) => a.attendanceRate - b.attendanceRate).slice(0, 10) // Get the 10 students with lowest attendance

    return {
      labels: sortedStudents.map((student) => student.student.name),
      datasets: [
        {
          label: "Attendance Rate (%)",
          data: sortedStudents.map((student) => student.attendanceRate),
          backgroundColor: sortedStudents.map((student) =>
            student.attendanceRate < 70
              ? "rgba(255, 99, 132, 0.6)"
              : student.attendanceRate < 85
                ? "rgba(255, 206, 86, 0.6)"
                : "rgba(75, 192, 192, 0.6)",
          ),
          borderColor: sortedStudents.map((student) =>
            student.attendanceRate < 70
              ? "rgba(255, 99, 132, 1)"
              : student.attendanceRate < 85
                ? "rgba(255, 206, 86, 1)"
                : "rgba(75, 192, 192, 1)",
          ),
          borderWidth: 1,
        },
      ],
    }
  }

  const attendanceStatusData = getAttendanceStatusData()
  const atRiskStudentsData = getAtRiskStudentsData()

  // Get at-risk students
  const getAtRiskStudents = () => {
    if (!attendanceData) return []

    return attendanceData
      .filter((student: any) => student.isAtRisk)
      .sort((a: any, b: any) => a.attendanceRate - b.attendanceRate)
  }

  const atRiskStudents = getAtRiskStudents()

  return (
    <DashboardLayout title="AI Attendance Insights" requiredRole="Admin">
      <div className="space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AI-Powered Attendance Insights</CardTitle>
            <CardDescription>
              Use artificial intelligence to analyze attendance patterns and identify at-risk students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.sclassName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="term">Current Term</SelectItem>
                    <SelectItem value="year">Current Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={analyzeAttendance} disabled={analyzing}>
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Analyze Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {attendanceData && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>Summary of attendance data for {attendanceData.length} students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Average Attendance</p>
                        <h3 className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">
                          {attendanceData.length > 0
                            ? (
                                attendanceData.reduce((sum: number, student: any) => sum + student.attendanceRate, 0) /
                                attendanceData.length
                              ).toFixed(2)
                            : 0}
                          %
                        </h3>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">At-Risk Students</p>
                        <h3 className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">
                          {atRiskStudents.length}
                        </h3>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Period</p>
                        <h3 className="mt-2 text-xl font-bold text-blue-700 dark:text-blue-300">
                          {selectedPeriod === "week"
                            ? "Last Week"
                            : selectedPeriod === "month"
                              ? "Last Month"
                              : selectedPeriod === "term"
                                ? "Current Term"
                                : "Current Year"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>Insights generated by artificial intelligence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[200px] overflow-y-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                    <p className="whitespace-pre-line text-sm">{analysis}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="distribution" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="distribution">
                  <PieChart className="mr-2 h-4 w-4" />
                  Attendance Distribution
                </TabsTrigger>
                <TabsTrigger value="at-risk">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  At-Risk Students
                </TabsTrigger>
                <TabsTrigger value="trends">
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Attendance Trends
                </TabsTrigger>
              </TabsList>
              <TabsContent value="distribution">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Attendance Status Distribution</CardTitle>
                    <CardDescription>Distribution of attendance statuses across all students</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {attendanceStatusData ? (
                      <Chart
                        type="pie"
                        data={attendanceStatusData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="at-risk">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>At-Risk Students</CardTitle>
                    <CardDescription>Students with attendance rates below 80%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {atRiskStudents.length > 0 ? (
                      <div className="space-y-4">
                        <div className="h-[300px] overflow-y-auto">
                          {atRiskStudents.map((student: any, index: number) => (
                            <div
                              key={student.student.id}
                              className="mb-4 flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-red-100 text-red-800">
                                    {student.student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <p className="font-medium">{student.student.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {student.class.sclassName} | Roll: {student.student.rollNum}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    student.attendanceRate < 60
                                      ? "destructive"
                                      : student.attendanceRate < 75
                                        ? "outline"
                                        : "secondary"
                                  }
                                >
                                  {student.attendanceRate.toFixed(2)}% Attendance
                                </Badge>
                                <div className="mt-2 w-32">
                                  <Progress
                                    value={student.attendanceRate}
                                    className="h-2"
                                    indicatorColor={
                                      student.attendanceRate < 60
                                        ? "bg-red-500"
                                        : student.attendanceRate < 75
                                          ? "bg-amber-500"
                                          : "bg-yellow-500"
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[300px] items-center justify-center">
                        <div className="text-center">
                          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                          <p className="mt-4 text-lg font-medium">No At-Risk Students</p>
                          <p className="text-sm text-muted-foreground">All students have attendance rates above 80%</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export List
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="trends">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                    <CardDescription>Students with lowest attendance rates</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {atRiskStudentsData ? (
                      <Chart
                        type="bar"
                        data={atRiskStudentsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
