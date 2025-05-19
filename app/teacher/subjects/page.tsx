"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpenCheck, GraduationCap, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Subject {
  id: string
  name: string
  code: string
  description: string
  classes: {
    id: string
    name: string
    section: string
  }[]
  students: {
    id: string
    firstName: string
    lastName: string
    admissionNumber: string
    photoUrl?: string
  }[]
}

export default function TeacherSubjectsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("classes")

  useEffect(() => {
    if (token) {
      fetchSubjects()
    }
  }, [token])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subjects?teacherId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch subjects")
      }

      const data = await response.json()
      setSubjects(data)
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

  const viewSubjectDetails = (subject: Subject) => {
    setSelectedSubject(subject)
    setViewDialogOpen(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        <p className="text-muted-foreground">View and manage your assigned subjects.</p>
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
                <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpenCheck className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No subjects assigned</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">You don't have any subjects assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{subject.name}</CardTitle>
                  <Badge variant="outline">{subject.code}</Badge>
                </div>
                <CardDescription>
                  {subject.classes?.length || 0} {subject.classes?.length === 1 ? "class" : "classes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm">{subject.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => viewSubjectDetails(subject)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Subject Details Dialog */}
      {selectedSubject && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedSubject.name} ({selectedSubject.code})
              </DialogTitle>
              <DialogDescription>{selectedSubject.description}</DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classes" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Classes ({selectedSubject.classes?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({selectedSubject.students?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="mt-4">
                {selectedSubject.classes?.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-base font-semibold">No classes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This subject is not assigned to any classes yet.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {selectedSubject.classes?.map((cls) => (
                        <div key={cls.id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">Section: {cls.section}</p>
                          </div>
                          <Badge variant="outline">{cls.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="students" className="mt-4">
                {selectedSubject.students?.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-base font-semibold">No students</h3>
                    <p className="mt-1 text-sm text-muted-foreground">There are no students taking this subject yet.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {selectedSubject.students?.map((student) => (
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
