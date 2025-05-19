"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth-context"
import { Pencil, Trash2, Plus, Loader2, Search } from "lucide-react"

interface Class {
  id: string
  sclassName: string
}

interface Teacher {
  id: string
  name: string
}

interface Subject {
  id: string
  subName: string
  subCode: string
  sessions: number
  sclassId: string
  teacherId: string | null
  sclassName: Class
  teacher: Teacher | null
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    subName: "",
    subCode: "",
    sessions: "1",
    sclassId: "",
    teacherId: "",
  })
  const [formErrors, setFormErrors] = useState({
    subName: "",
    subCode: "",
    sessions: "",
    sclassId: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        // Fetch classes
        const classesResponse = await fetch(`/api/classes?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!classesResponse.ok) {
          throw new Error("Failed to fetch classes")
        }

        const classesData = await classesResponse.json()
        setClasses(classesData)

        // Fetch teachers
        const teachersResponse = await fetch(`/api/teachers?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!teachersResponse.ok) {
          throw new Error("Failed to fetch teachers")
        }

        const teachersData = await teachersResponse.json()
        setTeachers(teachersData)

        // Fetch subjects
        const subjectsResponse = await fetch(`/api/subjects?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!subjectsResponse.ok) {
          throw new Error("Failed to fetch subjects")
        }

        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      subName: "",
      subCode: "",
      sessions: "",
      sclassId: "",
    }
    let isValid = true

    if (!formData.subName.trim()) {
      errors.subName = "Subject name is required"
      isValid = false
    } else if (formData.subName.length < 2) {
      errors.subName = "Subject name must be at least 2 characters"
      isValid = false
    } else if (formData.subName.length > 50) {
      errors.subName = "Subject name must be less than 50 characters"
      isValid = false
    }

    if (!formData.subCode.trim()) {
      errors.subCode = "Subject code is required"
      isValid = false
    } else if (formData.subCode.length < 2) {
      errors.subCode = "Subject code must be at least 2 characters"
      isValid = false
    } else if (formData.subCode.length > 10) {
      errors.subCode = "Subject code must be less than 10 characters"
      isValid = false
    }

    const sessionsNum = Number.parseInt(formData.sessions)
    if (isNaN(sessionsNum) || sessionsNum < 1) {
      errors.sessions = "Sessions must be a positive number"
      isValid = false
    }

    if (!formData.sclassId) {
      errors.sclassId = "Class is required"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user selects
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleCreateSubject = () => {
    setSelectedSubject(null)
    setFormData({
      subName: "",
      subCode: "",
      sessions: "1",
      sclassId: "",
      teacherId: "",
    })
    setFormErrors({
      subName: "",
      subCode: "",
      sessions: "",
      sclassId: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setFormData({
      subName: subject.subName,
      subCode: subject.subCode,
      sessions: subject.sessions.toString(),
      sclassId: subject.sclassId,
      teacherId: subject.teacherId || "",
    })
    setFormErrors({
      subName: "",
      subCode: "",
      sessions: "",
      sclassId: "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")

      if (!token || !schoolId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication failed. Please log in again.",
        })
        setIsSubmitting(false)
        return
      }

      const url = selectedSubject ? `/api/subjects/${selectedSubject.id}` : "/api/subjects"
      const method = selectedSubject ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          sessions: Number.parseInt(formData.sessions),
          teacherId: formData.teacherId || null,
          schoolId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save subject")
      }

      const savedSubject = await response.json()

      if (selectedSubject) {
        // Update existing subject in the list
        setSubjects((prevSubjects) => prevSubjects.map((s) => (s.id === savedSubject.id ? savedSubject : s)))
        toast({
          title: "Success",
          description: "Subject updated successfully.",
        })
      } else {
        // Add new subject to the list
        setSubjects((prevSubjects) => [...prevSubjects, savedSubject])
        toast({
          title: "Success",
          description: "Subject created successfully.",
        })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving subject:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save subject. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSubject) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication failed. Please log in again.",
        })
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete subject")
      }

      // Remove deleted subject from the list
      setSubjects((prevSubjects) => prevSubjects.filter((s) => s.id !== selectedSubject.id))
      toast({
        title: "Success",
        description: "Subject deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      console.error("Error deleting subject:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete subject. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "Not Assigned"
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? teacher.name : "Unknown Teacher"
  }

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.sclassName.sclassName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout title="Subjects Management" requiredRole="Admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Manage school subjects, their classes and assigned teachers.</CardDescription>
          </div>
          <Button onClick={handleCreateSubject}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No subjects match your search."
                  : "No subjects found. Create your first subject to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 p-4 font-medium border-b">
                <div className="col-span-3">Subject Name</div>
                <div className="col-span-2">Code</div>
                <div className="col-span-2">Class</div>
                <div className="col-span-3">Teacher</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredSubjects.map((subject) => (
                  <div key={subject.id} className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-3">{subject.subName}</div>
                    <div className="col-span-2">{subject.subCode}</div>
                    <div className="col-span-2">{subject.sclassName.sclassName}</div>
                    <div className="col-span-3">{getTeacherName(subject.teacherId)}</div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditSubject(subject)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
            <DialogDescription>
              {selectedSubject ? "Update the subject details below." : "Enter the details for the new subject."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subName">Subject Name</Label>
              <Input
                id="subName"
                name="subName"
                value={formData.subName}
                onChange={handleInputChange}
                placeholder="Enter subject name"
              />
              {formErrors.subName && <p className="text-sm text-destructive">{formErrors.subName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCode">Subject Code</Label>
              <Input
                id="subCode"
                name="subCode"
                value={formData.subCode}
                onChange={handleInputChange}
                placeholder="Enter subject code"
              />
              {formErrors.subCode && <p className="text-sm text-destructive">{formErrors.subCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions">Sessions</Label>
              <Input
                id="sessions"
                name="sessions"
                type="number"
                min="1"
                value={formData.sessions}
                onChange={handleInputChange}
                placeholder="Number of sessions"
              />
              {formErrors.sessions && <p className="text-sm text-destructive">{formErrors.sessions}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sclassId">Class</Label>
              <Select value={formData.sclassId} onValueChange={(value) => handleSelectChange("sclassId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.sclassName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.sclassId && <p className="text-sm text-destructive">{formErrors.sclassId}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher (Optional)</Label>
              <Select value={formData.teacherId} onValueChange={(value) => handleSelectChange("teacherId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-assigned">Not Assigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedSubject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject &quot;{selectedSubject?.subName}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
