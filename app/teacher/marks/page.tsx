"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, Users, BookOpen, Award, TrendingUp, Calculator } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Class {
  id: string
  name: string
  studentCount: number
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  name: string
  rollNum: string
  admissionNumber: string
  photo?: string
  class: {
    id: string
    name: string
  }
  existingResult?: {
    id: string
    marksObtained: number
    grade: string
    examType: string
  }
}

interface ExamResult {
  id: string
  marksObtained: number
  totalMarks: number
  grade: string
  examType: string
  student: {
    id: string
    name: string
    rollNum: string
    admissionNumber: string
  }
  subject: {
    id: string
    subName: string
    subCode: string
  }
}

const examTypes = [
  { value: "BOT", label: "Beginning of Term", color: "bg-blue-500" },
  { value: "MID", label: "Mid Term", color: "bg-yellow-500" },
  { value: "END", label: "End of Term", color: "bg-green-500" },
]

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A+":
      return "bg-green-600"
    case "A":
      return "bg-green-500"
    case "B+":
      return "bg-blue-500"
    case "B":
      return "bg-blue-400"
    case "C+":
      return "bg-yellow-500"
    case "C":
      return "bg-yellow-400"
    case "D":
      return "bg-orange-500"
    case "F":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const calculateGrade = (marks: number, totalMarks = 100): string => {
  const percentage = (marks / totalMarks) * 100

  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C+"
  if (percentage >= 40) return "C"
  if (percentage >= 30) return "D"
  return "F"
}

export default function TeacherMarksPage() {
  const { user, token, isLoading: authLoading } = useAuth()

  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<ExamResult[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("")
  const [totalMarks, setTotalMarks] = useState("100")
  const [studentMarks, setStudentMarks] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    console.log("=== Getting Auth Headers ===")
    console.log("Token from context:", token ? "Present" : "Missing")
    console.log("User from context:", user ? user.name : "Missing")

    if (!token) {
      console.error("No token available in auth context")
      throw new Error("No authentication token available")
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    console.log("Headers created:", {
      Authorization: headers.Authorization ? "Bearer [TOKEN]" : "Missing",
      "Content-Type": headers["Content-Type"],
    })

    return headers
  }

  // Wait for authentication before fetching data
  useEffect(() => {
    console.log("=== Auth State Changed ===")
    console.log("Auth loading:", authLoading)
    console.log("User:", user ? `${user.name} (${user.role})` : "None")
    console.log("Token:", token ? "Present" : "Missing")

    if (!authLoading && user && token && user.role === "Teacher") {
      console.log("Authentication ready, fetching classes...")
      fetchClasses()
    } else if (!authLoading && (!user || user.role !== "Teacher")) {
      console.log("User is not a teacher or not authenticated")
      toast({
        title: "Access Denied",
        description: "You must be logged in as a teacher to access this page",
        variant: "destructive",
      })
    } else if (!authLoading && !token) {
      console.log("No token available after auth loading completed")
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please log in again.",
        variant: "destructive",
      })
    }
  }, [authLoading, user, token])

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass && token && user) {
      fetchSubjects(selectedClass)
    } else {
      setSubjects([])
      setSelectedSubject("")
    }
  }, [selectedClass, token, user])

  // Fetch students when class, subject, and exam type are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedExamType && token && user) {
      fetchStudents(selectedClass, selectedSubject, selectedExamType)
    } else {
      setStudents([])
      setStudentMarks({})
    }
  }, [selectedClass, selectedSubject, selectedExamType, token, user])

  // Fetch results for viewing
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedExamType && token && user) {
      fetchResults()
    }
  }, [selectedClass, selectedSubject, selectedExamType, token, user])

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true)
      console.log("=== Fetching Classes ===")

      const headers = getAuthHeaders()
      console.log("Making request to /api/teacher/marks/classes")

      const response = await fetch("/api/teacher/marks/classes", {
        method: "GET",
        headers,
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok && data.success) {
        setClasses(data.classes)
        console.log("Classes set successfully:", data.classes.length, "classes")
        toast({
          title: "Success",
          description: `Loaded ${data.classes.length} classes`,
        })
      } else {
        console.error("Failed to fetch classes:", data)
        toast({
          title: "Error",
          description: data.error || data.details || "Failed to fetch classes",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch classes",
        variant: "destructive",
      })
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchSubjects = async (classId: string) => {
    try {
      setLoadingSubjects(true)
      console.log("=== Fetching Subjects ===")
      console.log("Class ID:", classId)

      const headers = getAuthHeaders()
      const response = await fetch(`/api/teacher/marks/subjects?classId=${classId}`, {
        method: "GET",
        headers,
      })

      console.log("Subjects response status:", response.status)
      const data = await response.json()
      console.log("Subjects data:", data)

      if (response.ok && data.success) {
        setSubjects(data.subjects)
        console.log("Subjects set successfully:", data.subjects.length, "subjects")
      } else {
        console.error("Failed to fetch subjects:", data)
        toast({
          title: "Error",
          description: data.error || data.details || "Failed to fetch subjects",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch subjects",
        variant: "destructive",
      })
    } finally {
      setLoadingSubjects(false)
    }
  }

  const fetchStudents = async (classId: string, subjectId: string, examType: string) => {
    try {
      setLoadingStudents(true)
      console.log("=== Fetching Students ===")
      console.log("Parameters:", { classId, subjectId, examType })

      const headers = getAuthHeaders()
      const response = await fetch(
        `/api/teacher/marks/students?classId=${classId}&subjectId=${subjectId}&examType=${examType}`,
        {
          method: "GET",
          headers,
        },
      )

      console.log("Students response status:", response.status)
      const data = await response.json()
      console.log("Students data:", data)

      if (response.ok && data.success) {
        setStudents(data.students)
        console.log("Students set successfully:", data.students.length, "students")

        // Pre-fill existing marks
        const existingMarks: Record<string, string> = {}
        data.students.forEach((student: Student) => {
          if (student.existingResult) {
            existingMarks[student.id] = student.existingResult.marksObtained.toString()
          }
        })
        setStudentMarks(existingMarks)
      } else {
        console.error("Failed to fetch students:", data)
        toast({
          title: "Error",
          description: data.error || data.details || "Failed to fetch students",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchResults = async () => {
    try {
      console.log("=== Fetching Results ===")

      const headers = getAuthHeaders()
      const response = await fetch(
        `/api/teacher/marks/results?classId=${selectedClass}&subjectId=${selectedSubject}&examType=${selectedExamType}`,
        {
          method: "GET",
          headers,
        },
      )

      console.log("Results response status:", response.status)
      const data = await response.json()
      console.log("Results data:", data)

      if (response.ok && data.success) {
        setResults(data.results)
        console.log("Results set successfully:", data.results.length, "results")
      }
    } catch (error: any) {
      console.error("Error fetching results:", error)
    }
  }

  const handleMarksChange = (studentId: string, marks: string) => {
    setStudentMarks((prev) => ({
      ...prev,
      [studentId]: marks,
    }))
  }

  const handleSaveMarks = async () => {
    try {
      setSaving(true)

      // Validate that all students have marks
      const studentsWithMarks = students.filter((student) => {
        const marks = studentMarks[student.id]
        return marks !== undefined && marks !== "" && !isNaN(Number(marks))
      })

      if (studentsWithMarks.length === 0) {
        toast({
          title: "Error",
          description: "Please enter marks for at least one student",
          variant: "destructive",
        })
        return
      }

      const studentsData = studentsWithMarks.map((student) => ({
        studentId: student.id,
        marksObtained: Number(studentMarks[student.id]),
      }))

      console.log("=== Saving Marks ===")
      console.log("Save data:", {
        classId: selectedClass,
        subjectId: selectedSubject,
        examType: selectedExamType,
        totalMarks: Number(totalMarks),
        students: studentsData,
      })

      const headers = getAuthHeaders()
      const response = await fetch("/api/teacher/marks/results", {
        method: "POST",
        headers,
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          examType: selectedExamType,
          totalMarks: Number(totalMarks),
          students: studentsData,
        }),
      })

      console.log("Save response status:", response.status)
      const data = await response.json()
      console.log("Save response data:", data)

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: data.message,
        })

        // Refresh students and results
        await fetchStudents(selectedClass, selectedSubject, selectedExamType)
        await fetchResults()
      } else {
        console.error("Failed to save marks:", data)
        toast({
          title: "Error",
          description: data.error || data.details || "Failed to save marks",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error saving marks:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save marks",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatistics = () => {
    if (results.length === 0) return null

    const totalStudents = results.length
    const passedStudents = results.filter((r) => r.grade !== "F").length
    const passRate = ((passedStudents / totalStudents) * 100).toFixed(1)
    const averageMarks = (results.reduce((sum, r) => sum + r.marksObtained, 0) / totalStudents).toFixed(1)

    return {
      totalStudents,
      passedStudents,
      passRate,
      averageMarks,
    }
  }

  const statistics = getStatistics()

  // Show loading while authentication is being verified
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Verifying authentication...</span>
        </div>
      </div>
    )
  }

  // Show error if user is not authenticated or not a teacher
  if (!user || user.role !== "Teacher") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You must be logged in as a teacher to access this page.</p>
        </div>
      </div>
    )
  }

  // Show error if no token is available
  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-muted-foreground mt-2">No authentication token found. Please log in again.</p>
          <Button onClick={() => (window.location.href = "/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Marks</h1>
          <p className="text-muted-foreground">Enter and manage student marks for different exam types</p>
          <p className="text-sm text-muted-foreground">
            Logged in as: {user.name} ({user.role})
          </p>
        </div>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Mark Entry Setup
          </CardTitle>
          <CardDescription>Select class, subject, and exam type to enter marks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingClasses}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClasses ? "Loading..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingClasses && <p className="text-xs text-muted-foreground">Loading classes...</p>}
              {!loadingClasses && classes.length === 0 && (
                <p className="text-xs text-red-500">No classes found. Make sure you are assigned to teach classes.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={!selectedClass || loadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSubjects ? "Loading..." : "Select subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingSubjects && <p className="text-xs text-muted-foreground">Loading subjects...</p>}
              {!loadingSubjects && selectedClass && subjects.length === 0 && (
                <p className="text-xs text-red-500">No subjects found for this class.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type</Label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType} disabled={!selectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="100"
                min="1"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{statistics.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold">{statistics.passedStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">{statistics.passRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Marks</p>
                  <p className="text-2xl font-bold">{statistics.averageMarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="enter-marks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enter-marks">Enter Marks</TabsTrigger>
          <TabsTrigger value="view-results">View Results</TabsTrigger>
        </TabsList>

        <TabsContent value="enter-marks">
          <Card>
            <CardHeader>
              <CardTitle>Enter Student Marks</CardTitle>
              <CardDescription>
                {selectedClass && selectedSubject && selectedExamType
                  ? `Entering marks for ${subjects.find((s) => s.id === selectedSubject)?.name} - ${examTypes.find((t) => t.value === selectedExamType)?.label}`
                  : "Please select class, subject, and exam type to continue"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading students...</span>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Marks (/{totalMarks})</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const marks = studentMarks[student.id] || ""
                        const numMarks = Number(marks)
                        const percentage =
                          marks && !isNaN(numMarks) ? ((numMarks / Number(totalMarks)) * 100).toFixed(1) : ""
                        const grade = marks && !isNaN(numMarks) ? calculateGrade(numMarks, Number(totalMarks)) : ""

                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={student.photo || `/placeholder.svg?height=32&width=32`}
                                    alt={student.name}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = `/placeholder.svg?height=32&width=32`
                                    }}
                                  />
                                  <AvatarFallback>
                                    {student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.rollNum}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{student.admissionNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={marks}
                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                placeholder="0"
                                min="0"
                                max={totalMarks}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              {grade && <Badge className={`text-white ${getGradeColor(grade)}`}>{grade}</Badge>}
                            </TableCell>
                            <TableCell>
                              {percentage && <span className="text-sm font-medium">{percentage}%</span>}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveMarks} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Marks
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : selectedClass && selectedSubject && selectedExamType ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found for the selected class and subject.
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select class, subject, and exam type to view students.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-results">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>
                {selectedClass && selectedSubject && selectedExamType
                  ? `Results for ${subjects.find((s) => s.id === selectedSubject)?.name} - ${examTypes.find((t) => t.value === selectedExamType)?.label}`
                  : "Please select class, subject, and exam type to view results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      {/* <TableHead>Percentage</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => {
                      const percentage = ((result.marksObtained / result.totalMarks) * 100).toFixed(1)

                      return (
                        <TableRow key={result.id}>
                          <TableCell>
                            <span className="font-medium">{result.student.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.student.rollNum}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{result.student.admissionNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {result.marksObtained}/{result.totalMarks}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getGradeColor(result.grade)}`}>{result.grade}</Badge>
                          </TableCell>
                          {/* <TableCell>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </TableCell> */}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : selectedClass && selectedSubject && selectedExamType ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results found for the selected criteria.
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select class, subject, and exam type to view results.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
