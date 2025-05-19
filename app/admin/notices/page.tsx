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

interface Notice {
  id: string
  title: string
  details: string
  date: string
  createdAt: string
  updatedAt: string
}

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    details: "",
    date: "",
  })
  const [formErrors, setFormErrors] = useState({
    title: "",
    details: "",
    date: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`/api/notices?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch notices")
        }

        const noticesData = await response.json()
        setNotices(noticesData)
      } catch (error) {
        console.error("Error fetching notices:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notices. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      title: "",
      details: "",
      date: "",
    }
    let isValid = true

    if (!formData.title.trim()) {
      errors.title = "Title is required"
      isValid = false
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters"
      isValid = false
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters"
      isValid = false
    }

    if (!formData.details.trim()) {
      errors.details = "Details are required"
      isValid = false
    } else if (formData.details.length < 10) {
      errors.details = "Details must be at least 10 characters"
      isValid = false
    }

    if (!formData.date) {
      errors.date = "Date is required"
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

  const openDialog = (notice?: Notice) => {
    if (notice) {
      setSelectedNotice(notice)
      setFormData({
        title: notice.title,
        details: notice.details,
        date: new Date(notice.date).toISOString().split("T")[0],
      })
    } else {
      setSelectedNotice(null)
      setFormData({
        title: "",
        details: "",
        date: new Date().toISOString().split("T")[0],
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setFormErrors({
      title: "",
      details: "",
      date: "",
    })
  }

  const openDeleteDialog = (notice: Notice) => {
    setSelectedNotice(notice)
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

      const url = selectedNotice ? `/api/notices/${selectedNotice.id}` : "/api/notices"
      const method = selectedNotice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          details: formData.details,
          date: new Date(formData.date).toISOString(),
          schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${selectedNotice ? "update" : "create"} notice`)
      }

      const updatedNotice = await response.json()

      if (selectedNotice) {
        setNotices((prevNotices) =>
          prevNotices.map((notice) => (notice.id === selectedNotice.id ? updatedNotice : notice)),
        )
        toast({
          title: "Success",
          description: "Notice updated successfully",
        })
      } else {
        setNotices((prevNotices) => [...prevNotices, updatedNotice])
        toast({
          title: "Success",
          description: "Notice created successfully",
        })
      }

      closeDialog()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${selectedNotice ? "update" : "create"} notice. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedNotice) return

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

      const response = await fetch(`/api/notices/${selectedNotice.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete notice")
      }

      setNotices((prevNotices) => prevNotices.filter((notice) => notice.id !== selectedNotice.id))
      toast({
        title: "Success",
        description: "Notice deleted successfully",
      })
      closeDeleteDialog()
    } catch (error) {
      console.error("Error deleting notice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notice. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.details.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">School Notices</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search notices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Notice
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
      ) : filteredNotices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No notices found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? "No notices match your search criteria" : "Get started by adding your first notice"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Notice
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredNotices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="pb-2">
                <CardTitle>{notice.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Date</div>
                  <div>{new Date(notice.date).toLocaleDateString()}</div>
                </div>
                <div className="mb-4 space-y-1">
                  <div className="text-sm text-gray-500">Details</div>
                  <div className="line-clamp-3 text-sm">{notice.details}</div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openDialog(notice)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(notice)}>
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
            <DialogTitle>{selectedNotice ? "Edit Notice" : "Add New Notice"}</DialogTitle>
            <DialogDescription>
              {selectedNotice ? "Update the details of the notice" : "Enter the details of the new notice"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., School Closure Notice"
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
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
                <label htmlFor="details" className="text-sm font-medium">
                  Details
                </label>
                <Textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Enter the notice details"
                  className={formErrors.details ? "border-red-500" : ""}
                  rows={4}
                />
                {formErrors.details && <p className="text-xs text-red-500">{formErrors.details}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : selectedNotice ? "Update Notice" : "Add Notice"}
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
              This will permanently delete the notice "{selectedNotice?.title}". This action cannot be undone.
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
