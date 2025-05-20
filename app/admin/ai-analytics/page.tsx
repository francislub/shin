"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BarChart4, PieChart, LineChart, Download, RefreshCw } from "lucide-react"
import { Chart } from "@/components/ui/chart-component"

export default function AIAnalytics() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [classes, setClasses] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const { toast } = useToast()

  // Fetch classes, terms, and subjects on component mount
  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch classes
        const classesResponse = await fetch("/api/classes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData)
        }

        // Fetch terms
        const termsResponse = await fetch("/api/terms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (termsResponse.ok) {
          const termsData = await termsResponse.json()
          setTerms(termsData)
        }

        // Fetch subjects
        const subjectsResponse = await fetch("/api/subjects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          setSubjects(subjectsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Function to analyze performance data
  const analyzePerformance = async () => {
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

      const response = await fetch("/api/ai/performance-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: localStorage.getItem("schoolId"),
          classId: selectedClass || undefined,
          termId: selectedTerm || undefined,
          subjectId: selectedSubject || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze performance data")
      }

      const data = await response.json()
      setPerformanceData(data.performanceData)
      setAnalysis(data.analysis)

      toast({
        title: "Analysis Complete",
        description: "Performance data has been analyzed successfully.",
      })
    } catch (error) {
      console.error("Error analyzing performance:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze performance data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Prepare chart data
  const getSubjectPerformanceData = () => {
    if (!performanceData || !performanceData.examResults) return null

    // Group by subject and calculate average
    const subjectPerformance: Record<string, { total: number; count: number }> = {}

    performanceData.examResults.forEach((result: any) => {
      if (!subjectPerformance[result.subjectName]) {
        subjectPerformance[result.subjectName] = { total: 0, count: 0 }
      }
      subjectPerformance[result.subjectName].total += result.percentage
      subjectPerformance[result.subjectName].count += 1
    })

    // Calculate averages and prepare chart data
    return {
      labels: Object.keys(subjectPerformance),
      datasets: [
        {
          label: "Average Performance (%)",
          data: Object.values(subjectPerformance).map((data: any) => data.total / data.count),
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const getGradeDistributionData = () => {
    if (!performanceData || !performanceData.examResults) return null

    // Count grades
    const gradeCount: Record<string, number> = {}

    performanceData.examResults.forEach((result: any) => {
      const grade = result.grade || "N/A"
      gradeCount[grade] = (gradeCount[grade] || 0) + 1
    })

    return {
      labels: Object.keys(gradeCount),
      datasets: [
        {
          label: "Grade Distribution",
          data: Object.values(gradeCount),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const subjectPerformanceData = getSubjectPerformanceData()
  const gradeDistributionData = getGradeDistributionData()

  return (
    <DashboardLayout title="AI Analytics" requiredRole="Admin">
      <div className="space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AI-Powered Performance Analytics</CardTitle>
            <CardDescription>
              Use artificial intelligence to analyze student performance data and gain valuable insights
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
                <label className="text-sm font-medium">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.termName} ({term.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subName} ({subject.subCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4 w-full md:w-auto" onClick={analyzePerformance} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Analyze Performance
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {performanceData && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>
                  Key metrics based on {performanceData.totalStudents} students and {performanceData.totalExams} exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Average Score</p>
                    <h3 className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">
                      {performanceData.averageScore.toFixed(2)}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Passing Rate</p>
                    <h3 className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">
                      {performanceData.passingRate.toFixed(2)}%
                    </h3>
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
                <div className="max-h-[300px] overflow-y-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                  <p className="whitespace-pre-line text-sm">{analysis}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {performanceData && (
          <Tabs defaultValue="subject" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subject">
                <BarChart4 className="mr-2 h-4 w-4" />
                Subject Performance
              </TabsTrigger>
              <TabsTrigger value="grades">
                <PieChart className="mr-2 h-4 w-4" />
                Grade Distribution
              </TabsTrigger>
              <TabsTrigger value="trends">
                <LineChart className="mr-2 h-4 w-4" />
                Performance Trends
              </TabsTrigger>
            </TabsList>
            <TabsContent value="subject">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Subject Performance Analysis</CardTitle>
                  <CardDescription>Average performance percentage by subject</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
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
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="grades">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Distribution of grades across all exams</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {gradeDistributionData ? (
                    <Chart
                      type="pie"
                      data={gradeDistributionData}
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
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="trends">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Performance trends over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Trend analysis requires more historical data</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
