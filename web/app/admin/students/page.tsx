"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Plus, Search, Trash2, Upload, UserPlus } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Student {
  id: string
  name: string
  rollNum: string
  gender: string
  photo?: string
  sclass: {
    id: string
    sclassName: string
  }
}

interface Class {
  id: string
  sclassName: string
}

interface Parent {
  id: string
  name: string
  email: string
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    rollNum: "",
    gender: "",
    sclassId: "",
    parentId: "",
    password: "",
    email: "",
  })

  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        // Fetch classes
        const classesResponse = await fetch(`/api/classes?schoolId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData)
        }

        // Fetch parents
        const parentsResponse = await fetch(`/api/parents?schoolId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (parentsResponse.ok) {
          const parentsData = await parentsResponse.json()
          setParents(parentsData)
        }

        // Fetch students
        const studentsResponse = await fetch(`/api/students?schoolId=${user?.id}`, {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedPhoto(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddStudent = async () => {
    if (!formData.name || !formData.rollNum || !formData.sclassId || !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          schoolId: user?.id,
        }),
      })

      if (response.ok) {
        const newStudent = await response.json()

        // Add the new student to the list
        setStudents((prev) => [...prev, newStudent])

        // Reset form
        setFormData({
          name: "",
          rollNum: "",
          gender: "",
          sclassId: "",
          parentId: "",
          password: "",
          email: "",
        })

        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Student added successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to add student",
        })
      }
    } catch (error) {
      console.error("Add student error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while adding student",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStudent = async () => {
    if (!selectedStudent || !formData.name || !formData.rollNum || !formData.sclassId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          rollNum: formData.rollNum,
          gender: formData.gender,
          sclassId: formData.sclassId,
          parentId: formData.parentId || null,
          ...(formData.password && { password: formData.password }),
        }),
      })

      if (response.ok) {
        const updatedStudent = await response.json()

        // Update the student in the list
        setStudents((prev) => prev.map((student) => (student.id === selectedStudent.id ? updatedStudent : student)))

        setIsEditDialogOpen(false)

        toast({
          title: "Success",
          description: "Student updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update student",
        })
      }
    } catch (error) {
      console.error("Edit student error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating student",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove the student from the list
        setStudents((prev) => prev.filter((student) => student.id !== id))

        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete student",
        })
      }
    } catch (error) {
      console.error("Delete student error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting student",
      })
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedStudent || !selectedPhoto) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a photo",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const formData = new FormData()
      formData.append("studentId", selectedStudent.id)
      formData.append("photo", selectedPhoto)

      const response = await fetch("/api/upload/student-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()

        // Update the student in the list
        setStudents((prev) =>
          prev.map((student) => (student.id === selectedStudent.id ? { ...student, photo: data.photoUrl } : student)),
        )

        setIsPhotoDialogOpen(false)
        setSelectedPhoto(null)
        setPhotoPreview(null)

        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to upload photo",
        })
      }
    } catch (error) {
      console.error("Upload photo error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while uploading photo",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student)
    setFormData({
      name: student.name,
      rollNum: student.rollNum,
      gender: student.gender || "",
      sclassId: student.sclass.id,
      parentId: "", // Would need to fetch the current parent ID if needed
      password: "",
      email: "",
    })
    setIsEditDialogOpen(true)
  }

  const openPhotoDialog = (student: Student) => {
    setSelectedStudent(student)
    setPhotoPreview(student.photo || null)
    setIsPhotoDialogOpen(true)
  }

  // Filter students based on search term and selected class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNum.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClass = selectedClass === "all" || student.sclass.id === selectedClass

    return matchesSearch && matchesClass
  })

  return (
    <DashboardLayout title="Student Management" requiredRole="Admin">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Students</TabsTrigger>
            {classes.map((cls) => (
              <TabsTrigger key={cls.id} value={cls.id}>
                {cls.sclassName}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex mt-4 md:mt-0">
            <div className="relative mr-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="w-full md:w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage students, their classes, and personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
                <div className="h-64 w-full animate-pulse rounded bg-muted"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No students found.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="relative h-10 w-10 rounded-full bg-muted">
                            {student.photo ? (
                              <img
                                src={student.photo || "/placeholder.svg"}
                                alt={student.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background shadow"
                              onClick={() => openPhotoDialog(student)}
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.rollNum}</TableCell>
                        <TableCell>{student.gender || "Not specified"}</TableCell>
                        <TableCell>{student.sclass.sclassName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(student)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Enter the student's details to create a new account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNum">Roll Number</Label>
                <Input
                  id="rollNum"
                  name="rollNum"
                  value={formData.rollNum}
                  onChange={handleInputChange}
                  placeholder="STU001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={formData.sclassId} onValueChange={(value) => handleSelectChange("sclassId", value)}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent (Optional)</Label>
              <Select value={formData.parentId} onValueChange={(value) => handleSelectChange("parentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="student@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rollNum">Roll Number</Label>
                <Input id="edit-rollNum" name="rollNum" value={formData.rollNum} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class</Label>
                <Select value={formData.sclassId} onValueChange={(value) => handleSelectChange("sclassId", value)}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent (Optional)</Label>
              <Select value={formData.parentId} onValueChange={(value) => handleSelectChange("parentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (Leave blank to keep current)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStudent} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Photo Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Student Photo</DialogTitle>
            <DialogDescription>Upload a photo for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full bg-muted">
                {photoPreview ? (
                  <img src={photoPreview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground">
                    {selectedStudent?.name.charAt(0)}
                  </div>
                )}
              </div>
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <Upload className="h-4 w-4" />
                  <span>Choose file</span>
                </div>
                <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadPhoto} disabled={isSubmitting || !selectedPhoto}>
              {isSubmitting ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
