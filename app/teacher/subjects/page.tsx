"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Users, GraduationCap, Search, Eye } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Subject {
  id: string
  subName: string
  subCode: string
  sessions: number
  sclass: {
    id: string
    sclassName: string
  }
  students: Array<{
    id: string
    name: string
    rollNum: string
    email?: string
  }>
}

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchSubjects = async () => {
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

        const response = await fetch(`/api/teachers/${user.id}/subjects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch subjects",
          })
        }
      } catch (error) {
        console.error("Fetch subjects error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching subjects",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubjects()
  }, [toast, user])

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsViewDialogOpen(true)
  }

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.sclass.sclassName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalStudents = subjects.reduce((sum, subject) => sum + subject.students.length, 0)
  const totalClasses = new Set(subjects.map((subject) => subject.sclass.id)).size

  return (
    <DashboardLayout title="My Subjects" requiredRole="Teacher">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Subjects you teach</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClasses}</div>
              <p className="text-xs text-muted-foreground">Different classes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>View and manage the subjects you teach.</CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search subjects..."
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
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No subjects match your search." : "No subjects assigned to you yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{subject.subName}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {subject.subCode}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewSubject(subject)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Class:</span>
                          <span className="font-medium">{subject.sclass.sclassName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">{subject.students.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sessions:</span>
                          <span className="font-medium">{subject.sessions}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Subject Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSubject?.subName} ({selectedSubject?.subCode})
              </DialogTitle>
              <DialogDescription>Subject details and enrolled students</DialogDescription>
            </DialogHeader>
            {selectedSubject && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Class</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{selectedSubject.sclass.sclassName}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{selectedSubject.students.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{selectedSubject.sessions}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSubject.students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.rollNum}</TableCell>
                              <TableCell>{student.email || "Not provided"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
