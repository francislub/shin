"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardList, PlusCircle, Save } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Class {
  id: string
  name: string
  section: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  photoUrl?: string
  results?: {
    id: string
    examType: string
    marks: number
    totalMarks: number
    grade?: string
  }
}

interface ExamResult {
  studentId: string
  marks: number
}

export default function TeacherExamsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedExamType, setSelectedExamType] = useState<string>("BOT")
  const [totalMarks, setTotalMarks] = useState<number>(100)
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingResults, setExistingResults] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (token) {
      fetchClasses()
    }
  }, [token])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teachers/${user?.id}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
        description: "Failed to load classes. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async (classId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teachers/${user?.id}/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch subjects")
      }

      const data = await response.json()
      // Filter subjects for the selected class
      const classSubjects = data.filter((subject: any) => subject.sclass.id === classId)
      setSubjects(classSubjects)
      setSelectedSubject("")
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!selectedClass || !selectedSubject) return

    try {
      setLoading(true)
      const response = await fetch(`/api/teachers/${user?.id}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      setStudents(data)

      // Initialize exam results for all students with 0 marks
      const initialResults = data.map((student: Student) => ({
        studentId: student.id,
        marks: 0,
      }))
      setExamResults(initialResults)

      // Check if results already exist for this exam type, class, and subject
      checkExistingResults()
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkExistingResults = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamType) return

    try {
      const response = await fetch(
        `/api/exams?classId=${selectedClass}&subjectId=${selectedSubject}&examType=${selectedExamType}&teacherId=${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to check existing results")
      }

      const data = await response.json()

      if (data.length > 0) {
        setExistingResults(true)
        setTotalMarks(data[0].totalMarks || 100)

        // Map the existing results to our format
        const existingResults = data.map((result: any) => ({
          studentId: result.studentId,
          marks: result.marksObtained,
        }))

        setExamResults(existingResults)

        // Update the students with their results
        setStudents((prevStudents) =>
          prevStudents.map((student) => {
            const resultRecord = data.find((record: any) => record.studentId === student.id)
            return {
              ...student,
              results: resultRecord
                ? {
                    id: resultRecord.id,
                    examType: resultRecord.exam.examType,
                    marks: resultRecord.marksObtained,
                    totalMarks: resultRecord.exam.totalMarks,
                    grade: resultRecord.grade,
                  }
                : undefined,
            }
          }),
        )
      } else {
        setExistingResults(false)
        setTotalMarks(100)
      }
    } catch (error) {
      console.error("Error checking existing results:", error)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass)
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedExamType) {
      fetchStudents()
    }
  }, [selectedClass, selectedSubject, selectedExamType])

  const handleMarksChange = (studentId: string, marks: number) => {
    // Ensure marks are not negative or greater than total marks
    const validMarks = Math.min(Math.max(0, marks), totalMarks)

    setExamResults((prevResults) =>
      prevResults.map((result) => (result.studentId === studentId ? { ...result, marks: validMarks } : result)),
    )
  }

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamType || examResults.length === 0) {
      toast({
        title: "Error",
        description: "Please select a class, subject, exam type and enter marks for all students.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examName: `${selectedExamType === "BOT" ? "Beginning of Term" : selectedExamType === "MID" ? "Mid-Term" : "End of Term"} Exam`,
          examType: selectedExamType,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          totalMarks,
          passingMarks: Math.floor(totalMarks * 0.4), // 40% passing
          subjectId: selectedSubject,
          sclassId: selectedClass,
          termId: "current", // You might need to get current term
          teacherId: user?.id,
          results: examResults.map((result) => ({
            studentId: result.studentId,
            marksObtained: result.marks,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save exam results")
      }

      toast({
        title: "Success",
        description: "Exam results saved successfully",
      })

      // Refresh the results data
      checkExistingResults()
      setOpen(false)
    } catch (error) {
      console.error("Error saving exam results:", error)
      toast({
        title: "Error",
        description: "Failed to save exam results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const calculatePercentage = (marks: number, totalMarks: number) => {
    return ((marks / totalMarks) * 100).toFixed(1)
  }

  const getGradeColor = (marks: number, totalMarks: number) => {
    const percentage = (marks / totalMarks) * 100
    if (percentage >= 80) return "text-green-600 dark:text-green-400"
    if (percentage >= 70) return "text-emerald-600 dark:text-emerald-400"
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400"
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400"
    if (percentage >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
        <p className="text-muted-foreground">Manage exam results for your classes and subjects.</p>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="class">Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger id="class">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            disabled={!selectedClass || subjects.length === 0}
          >
            <SelectTrigger id="subject">
              <SelectValue
                placeholder={
                  !selectedClass
                    ? "Select a class first"
                    : subjects.length === 0
                      ? "No subjects available"
                      : "Select subject"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="examType">Exam Type</Label>
          <Select value={selectedExamType} onValueChange={setSelectedExamType}>
            <SelectTrigger id="examType">
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOT">Beginning of Term (BOT)</SelectItem>
              <SelectItem value="MID">Mid-Term</SelectItem>
              <SelectItem value="END">End of Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {selectedClass && selectedSubject && selectedExamType ? (
            <>
              {selectedExamType === "BOT" && "Beginning of Term"}
              {selectedExamType === "MID" && "Mid-Term"}
              {selectedExamType === "END" && "End of Term"}
              {" Exam Results"}
            </>
          ) : (
            "Exam Results"
          )}
        </h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              disabled={!selectedClass || !selectedSubject || !selectedExamType || students.length === 0}
            >
              <PlusCircle className="h-4 w-4" />
              {existingResults ? "Edit Results" : "Add Results"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {existingResults ? "Edit" : "Add"}{" "}
                {selectedExamType === "BOT"
                  ? "Beginning of Term"
                  : selectedExamType === "MID"
                    ? "Mid-Term"
                    : "End of Term"}{" "}
                Exam Results
              </DialogTitle>
              <DialogDescription>
                {existingResults
                  ? "Update the exam results for students in this class and subject."
                  : "Enter the exam results for students in this class and subject."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number.parseInt(e.target.value) || 100)}
                    min={1}
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {student.photoUrl ? (
                            <AvatarImage
                              src={student.photoUrl || "/placeholder.svg"}
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                          ) : null}
                          <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={examResults.find((r) => r.studentId === student.id)?.marks || 0}
                          onChange={(e) => handleMarksChange(student.id, Number.parseInt(e.target.value) || 0)}
                          min={0}
                          max={totalMarks}
                        />
                        <span className="text-sm text-muted-foreground">/ {totalMarks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : existingResults ? "Update Results" : "Save Results"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-1">
                      <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !selectedClass || !selectedSubject || !selectedExamType ? (
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>Please select a class, subject, and exam type to view or add results.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No results to display</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a class, subject, and exam type to view or add results.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Students Found</CardTitle>
            <CardDescription>There are no students in this class for the selected subject.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no students enrolled in this class for the selected subject.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !existingResults ? (
        <Card>
          <CardHeader>
            <CardTitle>No Results Found</CardTitle>
            <CardDescription>
              No exam results have been added for this class, subject, and exam type yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No results found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Click the "Add Results" button to add exam results for this class and subject.
              </p>
              <Button className="mt-4 flex items-center gap-2" onClick={() => setOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Add Results
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedExamType === "BOT" && "Beginning of Term"}
              {selectedExamType === "MID" && "Mid-Term"}
              {selectedExamType === "END" && "End of Term"}
              {" Exam Results"}
            </CardTitle>
            <CardDescription>
              {classes.find((c) => c.id === selectedClass)?.name} •{" "}
              {subjects.find((s) => s.id === selectedSubject)?.name} • Total Marks: {totalMarks}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {students.map((student) => {
                  const result = examResults.find((r) => r.studentId === student.id)
                  const marks = result?.marks || 0

                  return (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {student.photoUrl ? (
                            <AvatarImage
                              src={student.photoUrl || "/placeholder.svg"}
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                          ) : null}
                          <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {marks} / {totalMarks}
                          </p>
                          <p className={`text-xs ${getGradeColor(marks, totalMarks)}`}>
                            {calculatePercentage(marks, totalMarks)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setOpen(true)}>
              Edit Results
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
