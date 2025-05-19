"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: string
  dateOfBirth: string
  admissionNumber: string
  class: {
    id: string
    name: string
  }
  subjects: {
    id: string
    name: string
  }[]
  photoUrl?: string
}

interface Class {
  id: string
  name: string
}

export default function TeacherStudentsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    if (token) {
      fetchTeacherClasses()
    }
  }, [token])

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes?teacherId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }

      const data = await response.json()
      setClasses(data)

      // After fetching classes, fetch students from all these classes
      if (data.length > 0) {
        await fetchStudents(data)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again later.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchStudents = async (teacherClasses: Class[]) => {
    try {
      // Create a list of class IDs
      const classIds = teacherClasses.map((c) => c.id)

      // Fetch students from all classes the teacher teaches
      const promises = classIds.map((classId) =>
        fetch(`/api/students?classId=${classId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch students for class ${classId}`)
          return res.json()
        }),
      )

      const results = await Promise.all(promises)

      // Combine all students from different classes
      const allStudents = results.flat()

      // Remove duplicates (if any)
      const uniqueStudents = Array.from(new Map(allStudents.map((student) => [student.id, student])).values())

      setStudents(uniqueStudents)
      setFilteredStudents(uniqueStudents)
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

  useEffect(() => {
    // Filter students based on search term and selected class
    let filtered = [...students]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (student) =>
          student.firstName.toLowerCase().includes(term) ||
          student.lastName.toLowerCase().includes(term) ||
          student.admissionNumber.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term),
      )
    }

    // Filter by class
    if (selectedClass && selectedClass !== "all") {
      filtered = filtered.filter((student) => student.class.id === selectedClass)
    }

    setFilteredStudents(filtered)
  }, [searchTerm, selectedClass, students])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student)
    setViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">View and manage students in your classes.</p>
      </div>
      <Separator />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="space-y-1">
                    <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <UserRound className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No students found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {searchTerm || selectedClass !== "all"
              ? "No students match your search criteria. Try adjusting your filters."
              : "You don't have any students assigned to your classes yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer transition-colors hover:bg-accent/5"
              onClick={() => viewStudentDetails(student)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {student.photoUrl ? (
                      <AvatarImage
                        src={student.photoUrl || "/placeholder.svg"}
                        alt={`${student.firstName} ${student.lastName}`}
                      />
                    ) : null}
                    <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <CardDescription>{student.admissionNumber}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <Badge variant="outline">{student.class.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate max-w-[180px]">{student.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedStudent.firstName} {selectedStudent.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-24 w-24 mb-4">
                {selectedStudent.photoUrl ? (
                  <AvatarImage
                    src={selectedStudent.photoUrl || "/placeholder.svg"}
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                  />
                ) : null}
                <AvatarFallback className="text-xl">
                  {getInitials(selectedStudent.firstName, selectedStudent.lastName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
              <p className="text-muted-foreground">{selectedStudent.admissionNumber}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{selectedStudent.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p>{selectedStudent.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p>{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p>{selectedStudent.class.name}</p>
              </div>
            </div>
            <Separator />
            <div className="py-4">
              <h3 className="mb-2 font-medium">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.subjects?.map((subject) => (
                  <Badge key={subject.id} variant="secondary">
                    {subject.name}
                  </Badge>
                ))}
                {(!selectedStudent.subjects || selectedStudent.subjects.length === 0) && (
                  <p className="text-sm text-muted-foreground">No subjects assigned</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
