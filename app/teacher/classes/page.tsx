"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, BookOpen, GraduationCap, Search, Eye } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Class {
  id: string
  sclassName: string
  term?: {
    id: string
    termName: string
  }
  students: Array<{
    id: string
    name: string
    rollNum: string
    email?: string
  }>
  subjects: Array<{
    id: string
    subName: string
    subCode: string
  }>
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchClasses = async () => {
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

        const response = await fetch(`/api/teachers/${user.id}/classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setClasses(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch classes",
          })
        }
      } catch (error) {
        console.error("Fetch classes error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching classes",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [toast, user])

  const handleViewClass = (classItem: Class) => {
    setSelectedClass(classItem)
    setIsViewDialogOpen(true)
  }

  // Filter classes based on search term
  const filteredClasses = classes.filter((classItem) =>
    classItem.sclassName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalStudents = classes.reduce((sum, classItem) => sum + classItem.students.length, 0)
  const totalSubjects = classes.reduce((sum, classItem) => sum + classItem.subjects.length, 0)

  return (
    <DashboardLayout title="My Classes" requiredRole="Teacher">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Classes you teach</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all your classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubjects}</div>
              <p className="text-xs text-muted-foreground">Subjects you teach</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>View and manage the classes you teach.</CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search classes..."
                    className="w-full md:w-[200px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-64 w-full animate-pulse rounded bg-muted"></div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No classes match your search." : "No classes assigned to you yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClasses.map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{classItem.sclassName}</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => handleViewClass(classItem)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                      {classItem.term && (
                        <Badge variant="secondary" className="w-fit">
                          {classItem.term.termName}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">{classItem.students.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Subjects:</span>
                          <span className="font-medium">{classItem.subjects.length}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-1">Subjects:</p>
                          <div className="flex flex-wrap gap-1">
                            {classItem.subjects.slice(0, 3).map((subject) => (
                              <Badge key={subject.id} variant="outline" className="text-xs">
                                {subject.subCode}
                              </Badge>
                            ))}
                            {classItem.subjects.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{classItem.subjects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Class Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedClass?.sclassName} - Class Details</DialogTitle>
              <DialogDescription>View students and subjects for this class</DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Students ({selectedClass.students.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Roll No.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedClass.students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.rollNum}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subjects ({selectedClass.subjects.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedClass.subjects.map((subject) => (
                              <TableRow key={subject.id}>
                                <TableCell className="font-medium">{subject.subName}</TableCell>
                                <TableCell>{subject.subCode}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
