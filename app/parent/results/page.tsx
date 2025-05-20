"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download, ChevronDown, ChevronUp, Award, TrendingUp, BookOpen } from "lucide-react"

interface Child {
  id: string
  name: string
  rollNum: string
  sclassName: {
    id: string
    sclassName: string
  }
}

interface Subject {
  id: string
  subName: string
  subCode: string
}

interface ExamResult {
  id: string
  examType: string
  date: string
  totalMarks: number
  passingMarks: number
  marksObtained: number
  remarks: string
  subject: {
    id: string
    subName: string
    subCode: string
  }
  student: {
    id: string
    name: string
    rollNum: string
  }
}

interface Term {
  id: string
  termName: string
  year: string
}

export default function ParentResultsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [results, setResults] = useState<ExamResult[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedExamType, setSelectedExamType] = useState<string>("All")
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)

  useEffect(() => {
    if (user) {
      fetchChildren()
      fetchTerms()
    }
  }, [user])

  useEffect(() => {
    if (selectedChild) {
      fetchSubjects()
      fetchResults()
    }
  }, [selectedChild, selectedTerm, selectedExamType])

  const fetchChildren = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/parent/${user?.id}/children`)
      if (!response.ok) throw new Error("Failed to fetch children")

      const data = await response.json()
      setChildren(data)

      if (data.length > 0) {
        setSelectedChild(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching children:", error)
      toast({
        title: "Error",
        description: "Failed to load children data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTerms = async () => {
    try {
      const response = await fetch(`/api/terms?schoolId=${user?.schoolId}`)
      if (!response.ok) throw new Error("Failed to fetch terms")

      const data = await response.json()
      setTerms(data)

      if (data.length > 0) {
        setSelectedTerm(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const child = children.find((c) => c.id === selectedChild)
      if (!child) return

      const response = await fetch(`/api/subjects?sclassId=${child.sclassName.id}`)
      if (!response.ok) throw new Error("Failed to fetch subjects")

      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchResults = async () => {
    try {
      setLoading(true)
      let url = `/api/exams/results?studentId=${selectedChild}`

      if (selectedTerm) {
        url += `&termId=${selectedTerm}`
      }

      if (selectedExamType !== "All") {
        url += `&examType=${selectedExamType}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch results")

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error fetching results:", error)
      toast({
        title: "Error",
        description: "Failed to load results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  const sortedResults = () => {
    if (!sortConfig) return results

    return [...results].sort((a, b) => {
      if (sortConfig.key === "subject") {
        if (a.subject.subName < b.subject.subName) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a.subject.subName > b.subject.subName) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      }

      if (sortConfig.key === "examType") {
        if (a.examType < b.examType) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a.examType > b.examType) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      }

      if (sortConfig.key === "date") {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return sortConfig.direction === "ascending"
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime()
      }

      if (sortConfig.key === "marksObtained") {
        return sortConfig.direction === "ascending"
          ? a.marksObtained - b.marksObtained
          : b.marksObtained - a.marksObtained
      }

      if (sortConfig.key === "totalMarks") {
        return sortConfig.direction === "ascending" ? a.totalMarks - b.totalMarks : b.totalMarks - a.totalMarks
      }

      if (sortConfig.key === "percentage") {
        const percentageA = (a.marksObtained / a.totalMarks) * 100
        const percentageB = (b.marksObtained / b.totalMarks) * 100
        return sortConfig.direction === "ascending" ? percentageA - percentageB : percentageB - percentageA
      }

      return 0
    })
  }

  const calculatePercentage = (marksObtained: number, totalMarks: number) => {
    return ((marksObtained / totalMarks) * 100).toFixed(1)
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C"
    if (percentage >= 40) return "D"
    return "F"
  }

  const getBadgeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500"
    if (percentage >= 80) return "bg-green-400"
    if (percentage >= 70) return "bg-blue-500"
    if (percentage >= 60) return "bg-blue-400"
    if (percentage >= 50) return "bg-yellow-500"
    if (percentage >= 40) return "bg-yellow-400"
    return "bg-red-500"
  }

  const calculateOverallPerformance = () => {
    if (results.length === 0) return { average: 0, highest: 0, lowest: 0 }

    const percentages = results.map((result) => (result.marksObtained / result.totalMarks) * 100)

    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const highest = Math.max(...percentages)
    const lowest = Math.min(...percentages)

    return { average, highest, lowest }
  }

  const performance = calculateOverallPerformance()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDownloadResults = () => {
    // In a real implementation, this would generate a PDF report
    toast({
      title: "Download Started",
      description: "Your results report is being generated and will download shortly.",
    })
  }

  const examTypes = ["All", "Midterm", "Final", "Quiz", "Assignment", "Project"]

  if (loading && !children.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Academic Results</h1>
          <p className="text-muted-foreground">View and track your child's academic performance</p>
        </div>
        <Button variant="outline" className="mt-4 md:mt-0" onClick={handleDownloadResults}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <div className="text-2xl font-bold">{performance.average.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Overall average score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <div className="text-2xl font-bold">{performance.highest.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Best performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <div className="text-2xl font-bold">{subjects.length}</div>
                <p className="text-xs text-muted-foreground">Enrolled subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <div className="text-2xl font-bold">{results.length}</div>
                <p className="text-xs text-muted-foreground">Completed assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="md:col-span-3">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Select Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} ({child.sclassName.sclassName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.termName} ({term.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Exam Type</label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Subject Performance</CardTitle>
                <CardDescription>Performance by subject</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4">
                    {subjects.map((subject) => {
                      const subjectResults = results.filter((r) => r.subject.id === subject.id)
                      const avgPercentage =
                        subjectResults.length > 0
                          ? subjectResults.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks) * 100, 0) /
                            subjectResults.length
                          : 0

                      return (
                        <div key={subject.id} className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{subject.subName}</span>
                            <span className="text-sm">{avgPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getBadgeColor(avgPercentage)}`}
                              style={{ width: `${avgPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                {selectedChild && children.find((c) => c.id === selectedChild)?.name}'s exam results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No results found</h3>
                  <p className="text-muted-foreground mt-2">
                    There are no exam results available for the selected filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("subject")}>
                          <div className="flex items-center">
                            Subject
                            {sortConfig?.key === "subject" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("examType")}>
                          <div className="flex items-center">
                            Exam Type
                            {sortConfig?.key === "examType" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                          <div className="flex items-center">
                            Date
                            {sortConfig?.key === "date" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort("marksObtained")}>
                          <div className="flex items-center justify-end">
                            Marks
                            {sortConfig?.key === "marksObtained" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort("totalMarks")}>
                          <div className="flex items-center justify-end">
                            Total
                            {sortConfig?.key === "totalMarks" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handleSort("percentage")}>
                          <div className="flex items-center justify-end">
                            Percentage
                            {sortConfig?.key === "percentage" &&
                              (sortConfig.direction === "ascending" ? (
                                <ChevronUp className="ml-1 h-4 w-4" />
                              ) : (
                                <ChevronDown className="ml-1 h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults().map((result) => {
                        const percentage = Number.parseFloat(
                          calculatePercentage(result.marksObtained, result.totalMarks),
                        )
                        const grade = getGrade(percentage)

                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.subject.subName}</TableCell>
                            <TableCell>{result.examType}</TableCell>
                            <TableCell>{formatDate(result.date)}</TableCell>
                            <TableCell className="text-right">{result.marksObtained}</TableCell>
                            <TableCell className="text-right">{result.totalMarks}</TableCell>
                            <TableCell className="text-right">{percentage}%</TableCell>
                            <TableCell className="text-right">
                              <Badge className={getBadgeColor(percentage) + " text-white"}>{grade}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
