"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Search, AlertTriangle, CheckCircle2, Download, BarChart4 } from "lucide-react"
import { Chart } from "@/components/ui/chart-component"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function AIPerformancePrediction() {
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [studentData, setStudentData] = useState<any>(null)
  const [prediction, setPrediction] = useState<string>("")
  const { toast } = useToast()

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
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

        const response = await fetch("/api/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch students")
        }

        const data = await response.json()
        setStudents(data)
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [toast])

  // Function to predict student performance
  const predictPerformance = async () => {
    if (!selectedStudent) {
      toast({
        title: "Selection Required",
        description: "Please select a student to predict performance.",
        variant: "destructive",
      })
      return
    }

    setPredicting(true)
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

      const response = await fetch("/api/ai/predict-performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to predict student performance")
      }

      const data = await response.json()
      setStudentData(data.studentData)
      setPrediction(data.prediction)

      toast({
        title: "Prediction Complete",
        description: "Student performance prediction has been generated.",
      })
    } catch (error) {
      console.error("Error predicting performance:", error)
      toast({
        title: "Prediction Failed",
        description: "Failed to predict student performance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPredicting(false)
    }
  }

  // Prepare chart data for subject performance
  const getSubjectPerformanceData = () => {
    if (!studentData || !studentData.subjectPerformance) return null

    const subjects = Object.keys(studentData.subjectPerformance)
    const averages = subjects.map((subject) => {
      const performances = studentData.subjectPerformance[subject]
      return performances.reduce((sum: number, perf: any) => sum + perf.percentage, 0) / performances.length
    })

    return {
      labels: subjects,
      datasets: [
        {
          label: "Average Performance (%)",
          data: averages,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    }
  }

  const subjectPerformanceData = getSubjectPerformanceData()

  // Extract prediction highlights
  const extractPredictionHighlights = () => {
    if (!prediction) return null

    // This is a simplified extraction - in a real app, you might want to use
    // a more structured approach to get this data from the AI response
    const lines = prediction.split("\n")

    const predictedGPA =
      lines
        .find((line) => line.includes("Predicted grade point average"))
        ?.split(":")[1]
        ?.trim() || "N/A"

    const improvingSubjects =
      lines
        .find((line) => line.includes("Subjects likely to improve"))
        ?.split(":")[1]
        ?.trim()
        ?.split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0) || []

    const concernSubjects =
      lines
        .find((line) => line.includes("Subjects that may need attention"))
        ?.split(":")[1]
        ?.trim()
        ?.split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0) || []

    const confidenceLevel =
      lines
        .find((line) => line.includes("Confidence level"))
        ?.split(":")[1]
        ?.trim() || "Medium"

    return {
      predictedGPA,
      improvingSubjects,
      concernSubjects,
      confidenceLevel,
    }
  }

  const predictionHighlights = extractPredictionHighlights()

  return (
    <DashboardLayout title="AI Performance Prediction" requiredRole="Admin">
      <div className="space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AI-Powered Performance Prediction</CardTitle>
            <CardDescription>
              Use artificial intelligence to predict student performance and identify areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.rollNum})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={predictPerformance} disabled={predicting || !selectedStudent}>
                  {predicting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Predict Performance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {studentData && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Student Profile</CardTitle>
                  <CardDescription>Current academic and behavioral profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-lg font-semibold">{studentData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Class</p>
                        <p className="text-lg font-semibold">{studentData.class}</p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">Attendance Rate</p>
                        <p className="text-sm font-medium">{studentData.attendanceRate.toFixed(2)}%</p>
                      </div>
                      <Progress value={studentData.attendanceRate} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                        <p className="text-xs font-medium text-muted-foreground">Discipline</p>
                        <p className="text-sm font-semibold">{studentData.behavior.discipline}</p>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                        <p className="text-xs font-medium text-muted-foreground">Time Management</p>
                        <p className="text-sm font-semibold">{studentData.behavior.timeManagement}</p>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                        <p className="text-xs font-medium text-muted-foreground">Smartness</p>
                        <p className="text-sm font-semibold">{studentData.behavior.smartness}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>AI Prediction</CardTitle>
                  <CardDescription>Performance prediction based on historical data</CardDescription>
                </CardHeader>
                <CardContent>
                  {predictionHighlights ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Predicted GPA</p>
                        <h3 className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {predictionHighlights.predictedGPA}
                        </h3>
                        <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                          Confidence: {predictionHighlights.confidenceLevel}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                          <div className="flex items-center">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Improving Subjects</p>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {predictionHighlights.improvingSubjects.length > 0 ? (
                              predictionHighlights.improvingSubjects.map((subject, index) => (
                                <li key={index} className="text-sm text-green-700 dark:text-green-300">
                                  • {subject}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-green-700 dark:text-green-300">
                                No specific subjects identified
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                          <div className="flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Needs Attention</p>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {predictionHighlights.concernSubjects.length > 0 ? (
                              predictionHighlights.concernSubjects.map((subject, index) => (
                                <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                                  • {subject}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-amber-700 dark:text-amber-300">
                                No specific concerns identified
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center">
                      <p className="text-muted-foreground">Prediction details not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="performance">
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Subject Performance
                </TabsTrigger>
                <TabsTrigger value="details">
                  <Search className="mr-2 h-4 w-4" />
                  Detailed Analysis
                </TabsTrigger>
              </TabsList>
              <TabsContent value="performance">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>Average performance by subject</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {subjectPerformanceData ? (
                      <Chart
                        type="bar"
                        data={subjectPerformanceData}
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
                        <p className="text-muted-foreground">No performance data available</p>
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
              <TabsContent value="details">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Detailed AI Analysis</CardTitle>
                    <CardDescription>Comprehensive analysis and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                      <p className="whitespace-pre-line text-sm">{prediction}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
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
