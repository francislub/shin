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
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react"

interface Term {
  id: string
  termName: string
}

interface Class {
  id: string
  sclassName: string
  termId: string | null
  term: Term | null
  createdAt: string
  updatedAt: string
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    sclassName: "",
    termId: "",
  })
  const [formErrors, setFormErrors] = useState({
    sclassName: "",
    termId: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        // Fetch terms first
        const termsResponse = await fetch(`/api/terms?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!termsResponse.ok) {
          throw new Error("Failed to fetch terms")
        }

        const termsData = await termsResponse.json()
        setTerms(termsData)

        // Then fetch classes
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
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load classes. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      sclassName: "",
      termId: "",
    }
    let isValid = true

    if (!formData.sclassName.trim()) {
      errors.sclassName = "Class name is required"
      isValid = false
    } else if (formData.sclassName.length < 2) {
      errors.sclassName = "Class name must be at least 2 characters"
      isValid = false
    } else if (formData.sclassName.length > 50) {
      errors.sclassName = "Class name must be less than 50 characters"
      isValid = false
    }

    if (!formData.termId) {
      errors.termId = "Term is required"
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

  const handleCreateClass = () => {
    setSelectedClass(null)
    setFormData({
      sclassName: "",
      termId: "",
    })
    setFormErrors({
      sclassName: "",
      termId: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem)
    setFormData({
      sclassName: classItem.sclassName,
      termId: classItem.termId || "",
    })
    setFormErrors({
      sclassName: "",
      termId: "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClass = (classItem: Class) => {
    setSelectedClass(classItem)
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

      const url = selectedClass ? `/api/classes/${selectedClass.id}` : "/api/classes"
      const method = selectedClass ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          schoolId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save class")
      }

      const savedClass = await response.json()

      if (selectedClass) {
        // Update existing class in the list
        setClasses((prevClasses) => prevClasses.map((c) => (c.id === savedClass.id ? savedClass : c)))
        toast({
          title: "Success",
          description: "Class updated successfully.",
        })
      } else {
        // Add new class to the list
        setClasses((prevClasses) => [...prevClasses, savedClass])
        toast({
          title: "Success",
          description: "Class created successfully.",
        })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving class:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save class. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedClass) return

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

      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete class")
      }

      // Remove deleted class from the list
      setClasses((prevClasses) => prevClasses.filter((c) => c.id !== selectedClass.id))
      toast({
        title: "Success",
        description: "Class deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
    } catch (error: any) {
      console.error("Error deleting class:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete class. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTermName = (termId: string | null) => {
    if (!termId) return "No Term Assigned"
    const term = terms.find((t) => t.id === termId)
    return term ? term.termName : "Unknown Term"
  }

  return (
    <DashboardLayout title="Classes Management" requiredRole="Admin">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Manage school classes and their associated terms.</CardDescription>
          </div>
          <Button onClick={handleCreateClass}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No classes found. Create your first class to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 p-4 font-medium border-b">
                <div className="col-span-5">Class Name</div>
                <div className="col-span-5">Term</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-5">{classItem.sclassName}</div>
                    <div className="col-span-5">{getTermName(classItem.termId)}</div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClass(classItem)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(classItem)}>
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
            <DialogTitle>{selectedClass ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription>
              {selectedClass ? "Update the class details below." : "Enter the details for the new class."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sclassName">Class Name</Label>
              <Input
                id="sclassName"
                name="sclassName"
                value={formData.sclassName}
                onChange={handleInputChange}
                placeholder="Enter class name"
              />
              {formErrors.sclassName && <p className="text-sm text-destructive">{formErrors.sclassName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="termId">Term</Label>
              <Select value={formData.termId} onValueChange={(value) => handleSelectChange("termId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.termName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.termId && <p className="text-sm text-destructive">{formErrors.termId}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedClass ? "Update" : "Create"}
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
              This will permanently delete the class &quot;{selectedClass?.sclassName}&quot;. This action cannot be
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
