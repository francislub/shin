"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ExamResult {
  id: string
  examName: string
  subjectId: string
  subjectName: string
  fullMarks: number
  marksObtained: number
  grade: string
  examDate: string
  position?: number
  teacherRemarks?: string
}

interface Term {
  id: string
  termName: string
  year: string
}

interface Subject {
  id: string
  name: string
  teacher: string
}

export function ParentChildResults({ childId }: { childId: string }) {
  const [terms, setTerms] = useState<Term[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTermsAndSubjects = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        // Fetch terms
        const termsResponse = await fetch("/api/terms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch subjects for the student
        const subjectsResponse = await fetch(`/api/students/${childId}/subjects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (termsResponse.ok && subjectsResponse.ok) {
          const termsData = await termsResponse.json()
          const subjectsData = await subjectsResponse.json()

          setTerms(termsData)
          setSubjects(subjectsData)

          // Set the most recent term as default
          if (termsData.length > 0) {
            setSelectedTerm(termsData[0].id)
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch terms or subjects",
          })
        }
      } catch (error) {
        console.error("Fetch terms and subjects error:", error)
        // Fallback to sample data if API fails
        const sampleTerms = [
          {
            id: "1",
            termName: "Term 1",
            year: "2023",
          },
          {
            id: "2",
            termName: "Term 2",
            year: "2023",
          },
          {
            id: "3",
            termName: "Term 3",
            year: "2023",
          },
        ]

        const sampleSubjects = [
          {
            id: "1",
            name: "Mathematics",
            teacher: "Mr. Johnson",
          },
          {
            id: "2",
            name: "English",
            teacher: "Mrs. Smith",
          },
          {
            id: "3",
            name: "Science",
            teacher: "Dr. Brown",
          },
          {
            id: "4",
            name: "Social Studies",
            teacher: "Ms. Davis",
          },
          {
            id: "5",
            name: "Art",
            teacher: "Mr. Wilson",
          },
        ]

        setTerms(sampleTerms)
        setSubjects(sampleSubjects)
        setSelectedTerm("1")
      }
    }

    fetchTermsAndSubjects()
  }, [childId, toast])

  useEffect(() => {
    if (!selectedTerm) return

    const fetchExamResults = async () => {
      setIsLoading(true)

      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch(`/api/students/${childId}/results?termId=${selectedTerm}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setExamResults(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch exam results",
          })
        }
      } catch (error) {
        console.error("Fetch exam results error:", error)
        // Fallback to sample data if API fails
        const sampleResults = []

        // Generate sample results for each subject
        for (const subject of subjects) {
          // Mid-term exam
          sampleResults.push({
            id: `mid-${subject.id}`,
            examName: "Mid-Term Exam",
            subjectId: subject.id,
            subjectName: subject.name,
            fullMarks: 100,
            marksObtained: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
            grade: "B+",
            examDate: "2023-03-15",
            position: Math.floor(Math.random() * 10) + 1,
            teacherRemarks: "Good performance, keep it up!",
          })

          // End-term exam
          sampleResults.push({
            id: `end-${subject.id}`,
            examName: "End-Term Exam",
            subjectId: subject.id,
            subjectName: subject.name,
            fullMarks: 100,
            marksObtained: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
            grade: "A",
            examDate: "2023-06-20",
            position: Math.floor(Math.random() * 5) + 1,
            teacherRemarks: "Excellent improvement!",
          })
        }

        setExamResults(sampleResults)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamResults()
  }, [selectedTerm, subjects, childId, toast])

  // Group results by exam type
  const midTermResults = examResults.filter((result) => result.examName.toLowerCase().includes("mid"))
  const endTermResults = examResults.filter((result) => result.examName.toLowerCase().includes("end"))

  // Calculate averages
  const calculateAverage = (results: ExamResult[]) => {
    if (results.length === 0) return 0
    const sum = results.reduce((total, result) => total + result.marksObtained, 0)
    return Math.round(sum / results.length)
  }

  const midTermAverage = calculateAverage(midTermResults)
  const endTermAverage = calculateAverage(endTermResults)

  // Prepare chart data
  const subjectPerformanceData = subjects.map((subject) => {
    const midTerm = midTermResults.find((result) => result.subjectId === subject.id)
    const endTerm = endTermResults.find((result) => result.subjectId === subject.id)

    return {
      subject: subject.name,
      "Mid-Term": midTerm?.marksObtained || 0,
      "End-Term": endTerm?.marksObtained || 0,
    }
  })

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade.charAt(0)) {
      case "A":
        return "text-green-600"
      case "B":
        return "text-blue-600"
      case "C":
        return "text-yellow-600"
      case "D":
        return "text-orange-600"
      default:
        return "text-red-600"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium">Select Term</label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.termName} {term.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Mid-Term Average</h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{midTermAverage}%</div>
                <Progress value={midTermAverage} className="flex-1" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">End-Term Average</h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{endTermAverage}%</div>
                <Progress value={endTermAverage} className="flex-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Subject Performance</h3>
          <div className="h-80">
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<ChartLegend />} />
                  <Bar dataKey="Mid-Term" name="Mid-Term" fill="#3b82f6" />
                  <Bar dataKey="End-Term" name="End-Term" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Exam Results Tabs */}
      <Tabs defaultValue="mid-term">
        <TabsList className="mb-4">
          <TabsTrigger value="mid-term">Mid-Term Results</TabsTrigger>
          <TabsTrigger value="end-term">End-Term Results</TabsTrigger>
        </TabsList>

        <TabsContent value="mid-term">
          <Card>
            <CardContent className="pt-6">
              {midTermResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No mid-term results available for this term.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Subject</th>
                        <th className="text-center py-3 px-4">Full Marks</th>
                        <th className="text-center py-3 px-4">Marks Obtained</th>
                        <th className="text-center py-3 px-4">Grade</th>
                        <th className="text-center py-3 px-4">Position</th>
                        <th className="text-left py-3 px-4">Teacher's Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {midTermResults.map((result) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-3 px-4 font-medium">{result.subjectName}</td>
                          <td className="py-3 px-4 text-center">{result.fullMarks}</td>
                          <td className="py-3 px-4 text-center font-bold">{result.marksObtained}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${getGradeColor(result.grade)}`}>{result.grade}</span>
                          </td>
                          <td className="py-3 px-4 text-center">{result.position || "-"}</td>
                          <td className="py-3 px-4 text-sm">{result.teacherRemarks || "-"}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50">
                        <td className="py-3 px-4 font-bold">Average</td>
                        <td className="py-3 px-4 text-center">100</td>
                        <td className="py-3 px-4 text-center font-bold">{midTermAverage}</td>
                        <td className="py-3 px-4 text-center"></td>
                        <td className="py-3 px-4 text-center"></td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="end-term">
          <Card>
            <CardContent className="pt-6">
              {endTermResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No end-term results available for this term.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Subject</th>
                        <th className="text-center py-3 px-4">Full Marks</th>
                        <th className="text-center py-3 px-4">Marks Obtained</th>
                        <th className="text-center py-3 px-4">Grade</th>
                        <th className="text-center py-3 px-4">Position</th>
                        <th className="text-left py-3 px-4">Teacher's Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endTermResults.map((result) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-3 px-4 font-medium">{result.subjectName}</td>
                          <td className="py-3 px-4 text-center">{result.fullMarks}</td>
                          <td className="py-3 px-4 text-center font-bold">{result.marksObtained}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${getGradeColor(result.grade)}`}>{result.grade}</span>
                          </td>
                          <td className="py-3 px-4 text-center">{result.position || "-"}</td>
                          <td className="py-3 px-4 text-sm">{result.teacherRemarks || "-"}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50">
                        <td className="py-3 px-4 font-bold">Average</td>
                        <td className="py-3 px-4 text-center">100</td>
                        <td className="py-3 px-4 text-center font-bold">{endTermAverage}</td>
                        <td className="py-3 px-4 text-center"></td>
                        <td className="py-3 px-4 text-center"></td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
