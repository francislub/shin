"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users, BookOpen, GraduationCap } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Student {
  id: string
  name: string
  rollNum: string
  email?: string
  gender?: string
  photo?: string
  sclass?: {
    id: string
    sclassName: string
  }
  parent?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  subjects: Array<{
    id: string
    subName: string
    subCode: string
  }>
}

interface Class {
  id: string
  sclassName: string
  students: Student[]
}

interface Subject {
  id: string
  subName: string
  subCode: string
  sclass: {
    id: string
    sclassName: string
  }
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token || !user) {
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
            variant: "destructive",
          })
          return
        }

        // Fetch teacher details first to get their class and subject
        const teacherResponse = await fetch(`/api/teachers/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json()

          // Set classes based on teacher's assigned class
          if (teacherData.teachSclass) {
            setClasses([teacherData.teachSclass])
          }

          // Set subjects based on teacher's assigned subject
          if (teacherData.teachSubject) {
            setSubjects([teacherData.teachSubject])
          }
        }

        // Fetch students from teacher's class
        const studentsResponse = await fetch(`/api/teachers/${user.id}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setStudents(studentsData)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch students",
          })
        }
      } catch (error) {
        console.error("Fetch data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, user])

  // Filter students based on search term, selected class, and subject
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesClass = selectedClass === "all" || (student.sclass && student.sclass.id === selectedClass)

    const matchesSubject =
      selectedSubject === "all" || student.subjects.some((subject) => subject.id === selectedSubject)

    return matchesSearch && matchesClass && matchesSubject
  })

  const getStudentSubjects = (student: Student) => {
    return student.subjects.map((subject) => subject.subName).join(", ")
  }

  return (
    <DashboardLayout title="My Students" requiredRole="Teacher">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Across all your classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Classes you teach</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Subjects you teach</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>View and manage students from your classes and subjects.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="w-full md:w-[200px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full md:w-[150px]">
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
                  <SelectTrigger className="w-full md:w-[150px]">
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-64 w-full animate-pulse rounded bg-muted"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedClass !== "all" || selectedSubject !== "all"
                    ? "No students match your filters."
                    : "No students found in your classes."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                              <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.rollNum}</Badge>
                        </TableCell>
                        <TableCell>{student.sclass?.sclassName || "No class assigned"}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={getStudentSubjects(student)}>
                            {getStudentSubjects(student) || "No subjects assigned"}
                          </div>
                        </TableCell>
                        <TableCell>{student.gender || "Not specified"}</TableCell>
                        <TableCell>{student.email || "Not provided"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
