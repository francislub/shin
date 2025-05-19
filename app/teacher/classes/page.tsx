"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Class {
  id: string
  name: string
  section: string
  academicYear: string
  students: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
    photoUrl?: string
  }[]
  subjects: {
    id: string
    name: string
    code: string
  }[]
  teacher: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function TeacherClassesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("students")

  useEffect(() => {
    if (token) {
      fetchClasses()
    }
  }, [token])

  const fetchClasses = async () => {
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

  const viewClassDetails = (classItem: Class) => {
    setSelectedClass(classItem)
    setViewDialogOpen(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="text-muted-foreground">View and manage your assigned classes.</p>
      </div>
      <Separator />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-9 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No classes assigned</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">You don't have any classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>Section: {classItem.section}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Academic Year:</span>
                    <span>{classItem.academicYear}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Students:</span>
                    <span>{classItem.students?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subjects:</span>
                    <span>{classItem.subjects?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => viewClassDetails(classItem)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Class Details Dialog */}
      {selectedClass && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedClass.name} - Section {selectedClass.section}
              </DialogTitle>
              <DialogDescription>Academic Year: {selectedClass.academicYear}</DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({selectedClass.students?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="subjects" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subjects ({selectedClass.subjects?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="mt-4">
                {selectedClass.students?.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-base font-semibold">No students</h3>
                    <p className="mt-1 text-sm text-muted-foreground">There are no students in this class yet.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {selectedClass.students?.map((student) => (
                        <div key={student.id} className="flex items-center gap-3 rounded-md border p-2">
                          <Avatar className="h-10 w-10">
                            {student.photoUrl ? (
                              <AvatarImage
                                src={student.photoUrl || "/placeholder.svg"}
                                alt={`${student.firstName} ${student.lastName}`}
                              />
                            ) : null}
                            <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="subjects" className="mt-4">
                {selectedClass.subjects?.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-base font-semibold">No subjects</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      There are no subjects assigned to this class yet.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {selectedClass.subjects?.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">Code: {subject.code}</p>
                          </div>
                          <Badge variant="outline">{subject.code}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
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
