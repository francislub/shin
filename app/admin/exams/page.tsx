"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Calendar, Users, BookOpen, GraduationCap } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Exam {
  id: string
  examName: string
  examType: string
  startDate: string
  endDate: string
  totalMarks: number
  passingMarks: number
  subject: {
    id: string
    subName: string
    subCode: string
  }
  sclass: {
    id: string
    sclassName: string
  }
  term: {
    id: string
    termName: string
  }
  teacher: {
    id: string
    name: string
  }
  results: Array<{
    id: string
    marksObtained: number
    student: {
      id: string
      name: string
      rollNum: string
    }
  }>
}

interface Class {
  id: string
  sclassName: string
}

interface Subject {
  id: string
  subName: string
  subCode: string
}

interface Term {
  id: string
  termName: string
}

interface Teacher {
  id: string
  name: string
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const { toast } = useToast()

  const [newExam, setNewExam] = useState({
    examName: "",
    examType: "",
    startDate: "",
    endDate: "",
    totalMarks: "",
    passingMarks: "",
    subjectId: "",
    sclassId: "",
    termId: "",
    teacherId: "",
  })

  useEffect(() => {
    fetchExams()
    fetchClasses()
    fetchSubjects()
    fetchTerms()
    fetchTeachers()
  }, [selectedClass, selectedSubject, selectedTerm])

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        })
        return
      }

      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("sclassId", selectedClass)
      if (selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedTerm !== "all") params.append("termId", selectedTerm)

      const response = await fetch(`/api/admin/exams?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data)
      } else {
        throw new Error("Failed to fetch exams")
      }
    } catch (error) {
      console.error("Error fetching exams:", error)
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin/classes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin/terms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTerms(data)
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/admin/teachers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExam),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Exam created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewExam({
          examName: "",
          examType: "",
          startDate: "",
          endDate: "",
          totalMarks: "",
          passingMarks: "",
          subjectId: "",
          sclassId: "",
          termId: "",
          teacherId: "",
        })
        fetchExams()
      } else {
        throw new Error("Failed to create exam")
      }
    } catch (error) {
      console.error("Error creating exam:", error)
      toast({
        title: "Error",
        description: "Failed to create exam",
        variant: "destructive",
      })
    }
  }

  const getExamTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "bot":
        return "bg-blue-100 text-blue-800"
      case "mid":
        return "bg-yellow-100 text-yellow-800"
      case "end":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const columns = [
    {
      accessorKey: "examName",
      header: "Exam Name",
    },
    {
      accessorKey: "examType",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge className={getExamTypeColor(row.getValue("examType"))}>{row.getValue("examType")}</Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }: any) => row.original.subject.subName,
    },
    {
      accessorKey: "sclass",
      header: "Class",
      cell: ({ row }: any) => row.original.sclass.sclassName,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }: any) => format(new Date(row.getValue("startDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }: any) => format(new Date(row.getValue("endDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "totalMarks",
      header: "Total Marks",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const { status, color } = getExamStatus(row.original.startDate, row.original.endDate)
        return <Badge className={color}>{status}</Badge>
      },
    },
    {
      accessorKey: "results",
      header: "Results",
      cell: ({ row }: any) => `${row.original.results.length} submitted`,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams Management</h1>
          <p className="text-muted-foreground">Manage and monitor all examinations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription>Add a new examination to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="examName">Exam Name</Label>
                  <Input
                    id="examName"
                    value={newExam.examName}
                    onChange={(e) => setNewExam({ ...newExam, examName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examType">Exam Type</Label>
                  <Select
                    value={newExam.examType}
                    onValueChange={(value) => setNewExam({ ...newExam, examType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOT">Beginning of Term</SelectItem>
                      <SelectItem value="MID">Mid Term</SelectItem>
                      <SelectItem value="END">End of Term</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                      <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newExam.startDate}
                    onChange={(e) => setNewExam({ ...newExam, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newExam.endDate}
                    onChange={(e) => setNewExam({ ...newExam, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={newExam.totalMarks}
                    onChange={(e) => setNewExam({ ...newExam, totalMarks: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingMarks">Passing Marks</Label>
                  <Input
                    id="passingMarks"
                    type="number"
                    value={newExam.passingMarks}
                    onChange={(e) => setNewExam({ ...newExam, passingMarks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sclassId">Class</Label>
                  <Select
                    value={newExam.sclassId}
                    onValueChange={(value) => setNewExam({ ...newExam, sclassId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.sclassName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select
                    value={newExam.subjectId}
                    onValueChange={(value) => setNewExam({ ...newExam, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subName} ({subject.subCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="termId">Term</Label>
                  <Select value={newExam.termId} onValueChange={(value) => setNewExam({ ...newExam, termId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.termName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacherId">Teacher</Label>
                  <Select
                    value={newExam.teacherId}
                    onValueChange={(value) => setNewExam({ ...newExam, teacherId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Exam</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter((exam) => new Date(exam.startDate) > new Date()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                exams.filter((exam) => {
                  const now = new Date()
                  return new Date(exam.startDate) <= now && new Date(exam.endDate) >= now
                }).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter((exam) => new Date(exam.endDate) < new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
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
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.termName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exams List</CardTitle>
          <CardDescription>Manage all examinations in your school</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={exams} searchKey="examName" searchPlaceholder="Search exams..." />
        </CardContent>
      </Card>
    </div>
  )
}
