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
import { Pencil, Trash2, Plus, Loader2, Search, Mail } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Class {
  id: string
  sclassName: string
}

interface Subject {
  id: string
  subName: string
}

interface Teacher {
  id: string
  name: string
  email: string
  teachSclass: Class
  teachSclassId: string
  teachSubject: Subject | null
  teachSubjectId: string | null
  isVerified: boolean
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    teachSclassId: "",
    teachSubjectId: "",
  })
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    teachSclassId: "",
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
      name: "",
      email: "",
      password: "",
      teachSclassId: "",
    }
    let isValid = true

    if (!formData.name.trim()) {
      errors.name = "Name is required"
      isValid = false
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters"
      isValid = false
    } else if (formData.name.length > 50) {
      errors.name = "Name must be less than 50 characters"
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid"
      isValid = false
    }

    if (!selectedTeacher && !formData.password.trim()) {
      errors.password = "Password is required for new teachers"
      isValid = false
    } else if (!selectedTeacher && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
      isValid = false
    }

    if (!formData.teachSclassId) {
      errors.teachSclassId = "Class is required"
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
    setFormData((prev) => ({
      ...prev,
      [name]: value === "unassigned" ? "" : value,
    }))
    // Clear error when user selects
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleCreateTeacher = () => {
    setSelectedTeacher(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      teachSclassId: "",
      teachSubjectId: "",
    })
    setFormErrors({
      name: "",
      email: "",
      password: "",
      teachSclassId: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "", // Don't populate password for security
      teachSclassId: teacher.teachSclassId,
      teachSubjectId: teacher.teachSubjectId || "",
    })
    setFormErrors({
      name: "",
      email: "",
      password: "",
      teachSclassId: "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
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

      const url = selectedTeacher ? `/api/teachers/${selectedTeacher.id}` : "/api/teachers"
      const method = selectedTeacher ? "PUT" : "POST"

      // Only include password if it's provided (for new teachers or password changes)
      const requestBody: any = {
        name: formData.name,
        email: formData.email,
        teachSclassId: formData.teachSclassId,
        teachSubjectId: formData.teachSubjectId || null,
      }

      if (formData.password) {
        requestBody.password = formData.password
      }

      if (!selectedTeacher) {
        requestBody.schoolId = schoolId
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save teacher")
      }

      const savedTeacher = await response.json()

      if (selectedTeacher) {
        // Update existing teacher in the list
        setTeachers((prevTeachers) => prevTeachers.map((t) => (t.id === savedTeacher.id ? savedTeacher : t)))
        toast({
          title: "Success",
          description: "Teacher updated successfully.",
        })
      } else {
        // Add new teacher to the list
        setTeachers((prevTeachers) => [...prevTeachers, savedTeacher])
        toast({
          title: "Success",
          description: "Teacher created successfully. Verification email sent.",
        })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving teacher:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save teacher. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTeacher) return

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

      const response = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete teacher")
      }

      // Remove deleted teacher from the list
      setTeachers((prevTeachers) => prevTeachers.filter((t) => t.id !== selectedTeacher.id))
      toast({
        title: "Success",
        description: "Teacher deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      console.error("Error deleting teacher:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete teacher. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "Not Assigned"
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.subName : "Unknown Subject"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout title="Teachers Management" requiredRole="Admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Manage school teachers, their classes and assigned subjects.</CardDescription>
          </div>
          <Button onClick={handleCreateTeacher}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No teachers match your search."
                  : "No teachers found. Add your first teacher to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 p-4 font-medium border-b">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Class</div>
                <div className="col-span-2">Subject</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-3 flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                      </Avatar>
                      <span>{teacher.name}</span>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="col-span-2">{teacher.teachSclass?.sclassName || "Not Assigned"}</div>
                    <div className="col-span-2">{getSubjectName(teacher.teachSubjectId)}</div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditTeacher(teacher)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTeacher(teacher)}>
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
            <DialogTitle>{selectedTeacher ? "Edit Teacher" : "Create New Teacher"}</DialogTitle>
            <DialogDescription>
              {selectedTeacher
                ? "Update the teacher details below."
                : "Enter the details for the new teacher. A verification email will be sent."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
              {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {selectedTeacher ? "Password (leave blank to keep current)" : "Password"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={selectedTeacher ? "Enter new password" : "Enter password"}
              />
              {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="teachSclassId">Class</Label>
              <Select
                value={formData.teachSclassId}
                onValueChange={(value) => handleSelectChange("teachSclassId", value)}
              >
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
              {formErrors.teachSclassId && <p className="text-sm text-destructive">{formErrors.teachSclassId}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="teachSubjectId">Subject (Optional)</Label>
              <Select
                value={formData.teachSubjectId}
                onValueChange={(value) => handleSelectChange("teachSubjectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Not Assigned</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subName}
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
              {selectedTeacher ? "Update" : "Create"}
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
              This will permanently delete the teacher &quot;{selectedTeacher?.name}&quot;. This action cannot be
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
