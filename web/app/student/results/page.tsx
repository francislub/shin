"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Award, BookOpen, TrendingUp } from "lucide-react"

interface ExamResult {
  id: string
  subject: string
  examType: string
  marks: number
  totalMarks: number
  grade: string
  term: string
  year: string
}

interface Term {
  id: string
  name: string
  year: string
}

export default function StudentResults() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        // Fetch terms first
        const termsResponse = await fetch("/api/student/terms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (termsResponse.ok) {
          const termsData = await termsResponse.json()
          setTerms(termsData)

          // Set the most recent term as selected
          if (termsData.length > 0) {
            setSelectedTerm(termsData[0].id)
          }
        }

        // Fetch results
        const resultsResponse = await fetch("/api/student/results", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json()
          setResults(resultsData)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch exam results",
          })
        }
      } catch (error) {
        console.error("Results error:", error)
        // Fallback to sample data if API fails
        const sampleTerms = [
          { id: "1", name: "Term 1", year: "2023" },
          { id: "2", name: "Term 2", year: "2023" },
          { id: "3", name: "Term 3", year: "2022" },
        ]

        setTerms(sampleTerms)
        setSelectedTerm("1")

        const sampleResults = [
          {
            id: "1",
            subject: "Mathematics",
            examType: "Mid-term",
            marks: 85,
            totalMarks: 100,
            grade: "A",
            term: "1",
            year: "2023",
          },
          {
            id: "2",
            subject: "English",
            examType: "Mid-term",
            marks: 78,
            totalMarks: 100,
            grade: "B+",
            term: "1",
            year: "2023",
          },
          {
            id: "3",
            subject: "Science",
            examType: "Mid-term",
            marks: 92,
            totalMarks: 100,
            grade: "A+",
            term: "1",
            year: "2023",
          },
          {
            id: "4",
            subject: "History",
            examType: "Mid-term",
            marks: 65,
            totalMarks: 100,
            grade: "C+",
            term: "1",
            year: "2023",
          },
          {
            id: "5",
            subject: "Mathematics",
            examType: "Final",
            marks: 88,
            totalMarks: 100,
            grade: "A",
            term: "1",
            year: "2023",
          },
          {
            id: "6",
            subject: "English",
            examType: "Final",
            marks: 82,
            totalMarks: 100,
            grade: "A-",
            term: "1",
            year: "2023",
          },
          {
            id: "7",
            subject: "Science",
            examType: "Final",
            marks: 95,
            totalMarks: 100,
            grade: "A+",
            term: "1",
            year: "2023",
          },
          {
            id: "8",
            subject: "History",
            examType: "Final",
            marks: 75,
            totalMarks: 100,
            grade: "B",
            term: "1",
            year: "2023",
          },
          {
            id: "9",
            subject: "Mathematics",
            examType: "Mid-term",
            marks: 80,
            totalMarks: 100,
            grade: "A-",
            term: "2",
            year: "2023",
          },
          {
            id: "10",
            subject: "English",
            examType: "Mid-term",
            marks: 75,
            totalMarks: 100,
            grade: "B",
            term: "2",
            year: "2023",
          },
        ]

        setResults(sampleResults)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [toast])

  // Filter results by selected term
  const filteredResults = selectedTerm ? results.filter((result) => result.term === selectedTerm) : results

  // Group results by exam type
  const midTermResults = filteredResults.filter((result) => result.examType === "Mid-term")
  const finalResults = filteredResults.filter((result) => result.examType === "Final")

  // Calculate overall average
  const calculateAverage = (results: ExamResult[]) => {
    if (results.length === 0) return 0

    const totalMarks = results.reduce((sum, result) => sum + result.marks, 0)
    return Math.round((totalMarks / (results.length * 100)) * 100)
  }

  const midTermAverage = calculateAverage(midTermResults)
  const finalAverage = calculateAverage(finalResults)
  const overallAverage = calculateAverage(filteredResults)

  // Get letter grade from percentage
  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return "A+"
    if (percentage >= 85) return "A"
    if (percentage >= 80) return "A-"
    if (percentage >= 75) return "B+"
    if (percentage >= 70) return "B"
    if (percentage >= 65) return "B-"
    if (percentage >= 60) return "C+"
    if (percentage >= 55) return "C"
    if (percentage >= 50) return "C-"
    if (percentage >= 45) return "D+"
    if (percentage >= 40) return "D"
    return "F"
  }

  // Get color class based on grade
  const getGradeColorClass = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600"
    if (grade.startsWith("B")) return "text-blue-600"
    if (grade.startsWith("C")) return "text-yellow-600"
    if (grade.startsWith("D")) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <DashboardLayout title="Exam Results" requiredRole="Student">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>View your exam results by term</CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name} ({term.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-40 w-full animate-pulse rounded bg-muted"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No results found for the selected term.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Performance Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Mid-Term Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">{midTermAverage}%</div>
                        <div className="ml-2 text-sm font-medium">{getLetterGrade(midTermAverage)}</div>
                      </div>
                      <Progress value={midTermAverage} className="mt-2 h-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Final Exam Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">{finalAverage}%</div>
                        <div className="ml-2 text-sm font-medium">{getLetterGrade(finalAverage)}</div>
                      </div>
                      <Progress value={finalAverage} className="mt-2 h-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="text-2xl font-bold">{overallAverage}%</div>
                        <div className="ml-2 text-sm font-medium">{getLetterGrade(overallAverage)}</div>
                      </div>
                      <Progress value={overallAverage} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                </div>

                {/* Results Tables */}
                <Tabs defaultValue="all" className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">All Results</TabsTrigger>
                    <TabsTrigger value="midterm">Mid-Term</TabsTrigger>
                    <TabsTrigger value="final">Final Exams</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <Card>
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Exam Type</TableHead>
                              <TableHead className="text-right">Marks</TableHead>
                              <TableHead className="text-right">Percentage</TableHead>
                              <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredResults.map((result) => (
                              <TableRow key={result.id}>
                                <TableCell className="font-medium">{result.subject}</TableCell>
                                <TableCell>{result.examType}</TableCell>
                                <TableCell className="text-right">
                                  {result.marks}/{result.totalMarks}
                                </TableCell>
                                <TableCell className="text-right">
                                  {Math.round((result.marks / result.totalMarks) * 100)}%
                                </TableCell>
                                <TableCell className={`text-right font-medium ${getGradeColorClass(result.grade)}`}>
                                  {result.grade}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="midterm">
                    <Card>
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Marks</TableHead>
                              <TableHead className="text-right">Percentage</TableHead>
                              <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {midTermResults.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No mid-term results found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              midTermResults.map((result) => (
                                <TableRow key={result.id}>
                                  <TableCell className="font-medium">{result.subject}</TableCell>
                                  <TableCell className="text-right">
                                    {result.marks}/{result.totalMarks}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Math.round((result.marks / result.totalMarks) * 100)}%
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${getGradeColorClass(result.grade)}`}>
                                    {result.grade}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="final">
                    <Card>
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Marks</TableHead>
                              <TableHead className="text-right">Percentage</TableHead>
                              <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {finalResults.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No final exam results found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              finalResults.map((result) => (
                                <TableRow key={result.id}>
                                  <TableCell className="font-medium">{result.subject}</TableCell>
                                  <TableCell className="text-right">
                                    {result.marks}/{result.totalMarks}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Math.round((result.marks / result.totalMarks) * 100)}%
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${getGradeColorClass(result.grade)}`}>
                                    {result.grade}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
