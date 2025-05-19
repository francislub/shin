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

interface ClassTeacherComment {
  id: string
  from: number
  to: number
  comment: string
  teacherId?: string
  createdAt: string
  updatedAt: string
}

export default function AdminClassTeacherComments() {
  const [comments, setComments] = useState<ClassTeacherComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<ClassTeacherComment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    comment: "",
  })
  const [formErrors, setFormErrors] = useState({
    from: "",
    to: "",
    comment: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/comments/class-teacher?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch class teacher comments")
        }

        const commentsData = await response.json()
        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching class teacher comments:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load class teacher comments. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      from: "",
      to: "",
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

  const openDialog = (comment?: ClassTeacherComment) => {
    if (comment) {
      setSelectedComment(comment)
      setFormData({
        from: comment.from.toString(),
        to: comment.to.toString(),
        comment: comment.comment,
      })
    } else {
      setSelectedComment(null)
      setFormData({
        from: "",
        to: "",
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
      comment: "",
    })
  }

  const openDeleteDialog = (comment: ClassTeacherComment) => {
    setSelectedComment(comment)
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

      const url = selectedComment ? `/api/comments/class-teacher/${selectedComment.id}` : "/api/comments/class-teacher"
      const method = selectedComment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: Number(formData.from),
          to: Number(formData.to),
          comment: formData.comment,
          schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${selectedComment ? "update" : "create"} class teacher comment`)
      }

      const updatedComment = await response.json()

      if (selectedComment) {
        setComments((prevComments) =>
          prevComments.map((comment) => (comment.id === selectedComment.id ? updatedComment : comment)),
        )
        toast({
          title: "Success",
          description: "Class teacher comment updated successfully",
        })
      } else {
        setComments((prevComments) => [...prevComments, updatedComment])
        toast({
          title: "Success",
          description: "Class teacher comment created successfully",
        })
      }

      closeDialog()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${selectedComment ? "update" : "create"} class teacher comment. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedComment) return

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

      const response = await fetch(`/api/comments/class-teacher/${selectedComment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete class teacher comment")
      }

      setComments((prevComments) => prevComments.filter((comment) => comment.id !== selectedComment.id))
      toast({
        title: "Success",
        description: "Class teacher comment deleted successfully",
      })
      closeDeleteDialog()
    } catch (error) {
      console.error("Error deleting class teacher comment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete class teacher comment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredComments = comments.filter((comment) =>
    comment.comment.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Class Teacher Comments</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search comments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Comment
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
      ) : filteredComments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No class teacher comments found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? "No comments match your search criteria"
              : "Get started by adding your first class teacher comment"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Comment
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <CardTitle>
                  From {comment.from}% to {comment.to}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{comment.comment}</p>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => openDialog(comment)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={() => openDeleteDialog(comment)}>
                    <Trash className="mr-2 h-4 w-4" /> Delete
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
            <DialogTitle>
              {selectedComment ? "Edit Class Teacher Comment" : "Add New Class Teacher Comment"}
            </DialogTitle>
            <DialogDescription>
              {selectedComment
                ? "Update the details of the class teacher comment"
                : "Enter the details of the new class teacher comment"}
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
                <label htmlFor="comment" className="text-sm font-medium">
                  Comment
                </label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="e.g., Good performance, keep improving!"
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
                {isSubmitting ? "Saving..." : selectedComment ? "Update Comment" : "Add Comment"}
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
              This will permanently delete this class teacher comment. This action cannot be undone.
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
