"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, Plus, Edit, Trash, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Student {
  id: string
  name: string
  admissionNumber: string
}

interface Complaint {
  id: string
  date: string
  complaint: string
  userId: string
  user: Student
  createdAt: string
  updatedAt: string
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    date: "",
    complaint: "",
    userId: "",
  })
  const [formErrors, setFormErrors] = useState({
    date: "",
    complaint: "",
    userId: "",
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

        // Fetch complaints
        const complaintsResponse = await fetch(`/api/complains?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!complaintsResponse.ok) {
          throw new Error("Failed to fetch complaints")
        }

        const complaintsData = await complaintsResponse.json()
        setComplaints(complaintsData)

        // Fetch students
        const studentsResponse = await fetch(`/api/students?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!studentsResponse.ok) {
          throw new Error("Failed to fetch students")
        }

        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
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
      date: "",
      complaint: "",
      userId: "",
    }
    let isValid = true

    if (!formData.date) {
      errors.date = "Date is required"
      isValid = false
    }

    if (!formData.complaint.trim()) {
      errors.complaint = "Complaint is required"
      isValid = false
    } else if (formData.complaint.length < 10) {
      errors.complaint = "Complaint must be at least 10 characters"
      isValid = false
    }

    if (!formData.userId) {
      errors.userId = "Student is required"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const openDialog = (complaint?: Complaint) => {
    if (complaint) {
      setSelectedComplaint(complaint)
      setFormData({
        date: new Date(complaint.date).toISOString().split("T")[0],
        complaint: complaint.complaint,
        userId: complaint.userId,
      })
    } else {
      setSelectedComplaint(null)
      setFormData({
        date: new Date().toISOString().split("T")[0],
        complaint: "",
        userId: "",
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setFormErrors({
      date: "",
      complaint: "",
      userId: "",
    })
  }

  const openViewDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsViewDialogOpen(true)
  }

  const closeViewDialog = () => {
    setIsViewDialogOpen(false)
  }

  const openDeleteDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")

      if (!token || !schoolId) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You need to be logged in to perform this action.",
        })
        return
      }

      const url = selectedComplaint ? `/api/complains/${selectedComplaint.id}` : "/api/complains"
      const method = selectedComplaint ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          complaint: formData.complaint,
          userId: formData.userId,
          schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${selectedComplaint ? "update" : "create"} complaint`)
      }

      const updatedComplaint = await response.json()

      if (selectedComplaint) {
        setComplaints((prevComplaints) =>
          prevComplaints.map((complaint) => (complaint.id === selectedComplaint.id ? updatedComplaint : complaint)),
        )
        toast({
          title: "Success",
          description: "Complaint updated successfully",
        })
      } else {
        setComplaints((prevComplaints) => [...prevComplaints, updatedComplaint])
        toast({
          title: "Success",
          description: "Complaint created successfully",
        })
      }

      closeDialog()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${selectedComplaint ? "update" : "create"} complaint. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedComplaint) return

    try {
      setIsSubmitting(true)

      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")

      if (!token || !schoolId) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You need to be logged in to perform this action.",
        })
        return
      }

      const response = await fetch(`/api/complains/${selectedComplaint.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete complaint")
      }

      setComplaints((prevComplaints) => prevComplaints.filter((complaint) => complaint.id !== selectedComplaint.id))
      toast({
        title: "Success",
        description: "Complaint deleted successfully",
      })
      closeDeleteDialog()
    } catch (error) {
      console.error("Error deleting complaint:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete complaint. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStudentName = (userId: string) => {
    const student = students.find((s) => s.id === userId)
    return student ? student.name : "Unknown Student"
  }

  const filteredComplaints = complaints.filter(
    (complaint) =>
      complaint.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.user?.name && complaint.user.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Student Complaints</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search complaints..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Complaint
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="bg-gray-100 p-4">
                <div className="h-6 w-3/4 rounded bg-gray-300" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No complaints found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? "No complaints match your search criteria" : "No student complaints have been recorded yet"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Complaint
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader className="pb-2">
                <CardTitle>{complaint.user?.name || getStudentName(complaint.userId)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Date</div>
                  <div>{new Date(complaint.date).toLocaleDateString()}</div>
                </div>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Complaint</div>
                  <div className="line-clamp-2 text-sm">{complaint.complaint}</div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openViewDialog(complaint)}>
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDialog(complaint)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(complaint)}>
                    <Trash className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedComplaint ? "Edit Complaint" : "Add New Complaint"}</DialogTitle>
            <DialogDescription>
              {selectedComplaint ? "Update the details of the complaint" : "Enter the details of the new complaint"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="userId" className="text-sm font-medium">
                  Student
                </label>
                <Select value={formData.userId} onValueChange={(value) => handleSelectChange("userId", value)}>
                  <SelectTrigger className={formErrors.userId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.admissionNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.userId && <p className="text-xs text-red-500">{formErrors.userId}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={formErrors.date ? "border-red-500" : ""}
                />
                {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="complaint" className="text-sm font-medium">
                  Complaint
                </label>
                <Textarea
                  id="complaint"
                  name="complaint"
                  value={formData.complaint}
                  onChange={handleInputChange}
                  placeholder="Enter the complaint details"
                  className={formErrors.complaint ? "border-red-500" : ""}
                  rows={4}
                />
                {formErrors.complaint && <p className="text-xs text-red-500">{formErrors.complaint}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : selectedComplaint ? "Update Complaint" : "Add Complaint"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Student</h3>
                <p>{selectedComplaint.user?.name || getStudentName(selectedComplaint.userId)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p>{new Date(selectedComplaint.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Complaint</h3>
                <p className="whitespace-pre-wrap">{selectedComplaint.complaint}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
                <p>{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={closeViewDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this complaint. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
