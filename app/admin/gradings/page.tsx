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
import { Search, Plus, Edit, Trash } from "lucide-react"

interface Grading {
  id: string
  from: number
  to: number
  grade: string
  comment: string
  createdAt: string
  updatedAt: string
}

export default function AdminGradings() {
  const [gradings, setGradings] = useState<Grading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedGrading, setSelectedGrading] = useState<Grading | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    grade: "",
    comment: "",
  })
  const [formErrors, setFormErrors] = useState({
    from: "",
    to: "",
    grade: "",
    comment: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchGradings = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/gradings?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch gradings")
        }

        const gradingsData = await response.json()
        setGradings(gradingsData)
      } catch (error) {
        console.error("Error fetching gradings:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load gradings. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGradings()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      from: "",
      to: "",
      grade: "",
      comment: "",
    }
    let isValid = true

    if (!formData.from) {
      errors.from = "From score is required"
      isValid = false
    } else if (isNaN(Number(formData.from)) || Number(formData.from) < 0 || Number(formData.from) > 100) {
      errors.from = "From score must be a number between 0 and 100"
      isValid = false
    }

    if (!formData.to) {
      errors.to = "To score is required"
      isValid = false
    } else if (isNaN(Number(formData.to)) || Number(formData.to) < 0 || Number(formData.to) > 100) {
      errors.to = "To score must be a number between 0 and 100"
      isValid = false
    } else if (Number(formData.from) >= Number(formData.to)) {
      errors.to = "To score must be greater than From score"
      isValid = false
    }

    if (!formData.grade.trim()) {
      errors.grade = "Grade is required"
      isValid = false
    }

    if (!formData.comment.trim()) {
      errors.comment = "Comment is required"
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

  const openDialog = (grading?: Grading) => {
    if (grading) {
      setSelectedGrading(grading)
      setFormData({
        from: grading.from.toString(),
        to: grading.to.toString(),
        grade: grading.grade,
        comment: grading.comment,
      })
    } else {
      setSelectedGrading(null)
      setFormData({
        from: "",
        to: "",
        grade: "",
        comment: "",
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setFormErrors({
      from: "",
      to: "",
      grade: "",
      comment: "",
    })
  }

  const openDeleteDialog = (grading: Grading) => {
    setSelectedGrading(grading)
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

      const url = selectedGrading ? `/api/gradings/${selectedGrading.id}` : "/api/gradings"
      const method = selectedGrading ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: Number(formData.from),
          to: Number(formData.to),
          grade: formData.grade,
          comment: formData.comment,
          schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${selectedGrading ? "update" : "create"} grading`)
      }

      const updatedGrading = await response.json()

      if (selectedGrading) {
        setGradings((prevGradings) =>
          prevGradings.map((grading) => (grading.id === selectedGrading.id ? updatedGrading : grading)),
        )
        toast({
          title: "Success",
          description: "Grading updated successfully",
        })
      } else {
        setGradings((prevGradings) => [...prevGradings, updatedGrading])
        toast({
          title: "Success",
          description: "Grading created successfully",
        })
      }

      closeDialog()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${selectedGrading ? "update" : "create"} grading. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedGrading) return

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

      const response = await fetch(`/api/gradings/${selectedGrading.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete grading")
      }

      setGradings((prevGradings) => prevGradings.filter((grading) => grading.id !== selectedGrading.id))
      toast({
        title: "Success",
        description: "Grading deleted successfully",
      })
      closeDeleteDialog()
    } catch (error) {
      console.error("Error deleting grading:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete grading. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredGradings = gradings.filter(
    (grading) =>
      grading.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grading.comment.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Grading System</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search gradings..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Grading
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
      ) : filteredGradings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No gradings found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? "No gradings match your search criteria" : "Get started by adding your first grading"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Grading
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredGradings.map((grading) => (
            <Card key={grading.id}>
              <CardHeader className="pb-2">
                <CardTitle>Grade: {grading.grade}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Score Range</div>
                  <div>
                    {grading.from}% - {grading.to}%
                  </div>
                </div>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Comment</div>
                  <div className="text-sm">{grading.comment}</div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openDialog(grading)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(grading)}>
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
            <DialogTitle>{selectedGrading ? "Edit Grading" : "Add New Grading"}</DialogTitle>
            <DialogDescription>
              {selectedGrading ? "Update the details of the grading" : "Enter the details of the new grading"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="from" className="text-sm font-medium">
                    From (%)
                  </label>
                  <Input
                    id="from"
                    name="from"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.from}
                    onChange={handleInputChange}
                    placeholder="e.g., 80"
                    className={formErrors.from ? "border-red-500" : ""}
                  />
                  {formErrors.from && <p className="text-xs text-red-500">{formErrors.from}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="to" className="text-sm font-medium">
                    To (%)
                  </label>
                  <Input
                    id="to"
                    name="to"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.to}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    className={formErrors.to ? "border-red-500" : ""}
                  />
                  {formErrors.to && <p className="text-xs text-red-500">{formErrors.to}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="grade" className="text-sm font-medium">
                  Grade
                </label>
                <Input
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="e.g., A"
                  className={formErrors.grade ? "border-red-500" : ""}
                />
                {formErrors.grade && <p className="text-xs text-red-500">{formErrors.grade}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium">
                  Comment
                </label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="e.g., Excellent performance"
                  className={formErrors.comment ? "border-red-500" : ""}
                  rows={3}
                />
                {formErrors.comment && <p className="text-xs text-red-500">{formErrors.comment}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : selectedGrading ? "Update Grading" : "Add Grading"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the grading "{selectedGrading?.grade}". This action cannot be undone.
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
