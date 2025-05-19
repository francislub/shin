"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Term {
  id: string
  termName: string
  nextTermStarts: string
  nextTermEnds: string
  status: string
  year: string
  createdAt: string
  updatedAt: string
}

export default function AdminTerms() {
  const [terms, setTerms] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    termName: "",
    nextTermStarts: "",
    nextTermEnds: "",
    status: "Active",
    year: new Date().getFullYear().toString(),
  })
  const [formErrors, setFormErrors] = useState({
    termName: "",
    nextTermStarts: "",
    nextTermEnds: "",
    year: "",
  })
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        // Wait for auth to finish loading before checking user
        if (authLoading) {
          return
        }

        // If user is null after auth has loaded, they're not authenticated
        if (!user) {
          setIsLoading(false)
          return
        }

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          console.log("Missing authentication tokens")
          setIsLoading(false)
          return
        }

        console.log("Fetching terms data...")
        const response = await fetch(`/api/terms?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API error response:", errorText)
          throw new Error(`Failed to fetch terms: ${response.status} ${response.statusText}`)
        }

        const termsData = await response.json()
        console.log("Terms data fetched:", termsData)
        setTerms(termsData)
      } catch (error) {
        console.error("Error fetching terms:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load terms. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTerms()
  }, [user, authLoading, toast])

  const validateForm = () => {
    const errors = {
      termName: "",
      nextTermStarts: "",
      nextTermEnds: "",
      year: "",
    }
    let isValid = true

    if (!formData.termName.trim()) {
      errors.termName = "Term name is required"
      isValid = false
    } else if (formData.termName.length < 3) {
      errors.termName = "Term name must be at least 3 characters"
      isValid = false
    } else if (formData.termName.length > 50) {
      errors.termName = "Term name must be less than 50 characters"
      isValid = false
    }

    if (!formData.nextTermStarts) {
      errors.nextTermStarts = "Next term start date is required"
      isValid = false
    }

    if (!formData.nextTermEnds) {
      errors.nextTermEnds = "Next term end date is required"
      isValid = false
    } else if (new Date(formData.nextTermEnds) <= new Date(formData.nextTermStarts)) {
      errors.nextTermEnds = "End date must be after start date"
      isValid = false
    }

    if (!formData.year) {
      errors.year = "Year is required"
      isValid = false
    } else if (!/^\d{4}$/.test(formData.year)) {
      errors.year = "Year must be a 4-digit number"
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

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateTerm = () => {
    setSelectedTerm(null)
    setFormData({
      termName: "",
      nextTermStarts: new Date().toISOString().split("T")[0],
      nextTermEnds: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0],
      status: "Active",
      year: new Date().getFullYear().toString(),
    })
    setFormErrors({
      termName: "",
      nextTermStarts: "",
      nextTermEnds: "",
      year: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditTerm = (term: Term) => {
    setSelectedTerm(term)
    setFormData({
      termName: term.termName,
      nextTermStarts: new Date(term.nextTermStarts).toISOString().split("T")[0],
      nextTermEnds: new Date(term.nextTermEnds).toISOString().split("T")[0],
      status: term.status,
      year: term.year,
    })
    setFormErrors({
      termName: "",
      nextTermStarts: "",
      nextTermEnds: "",
      year: "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTerm = (term: Term) => {
    setSelectedTerm(term)
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
          title: "Authentication Error",
          description: "Please log in again to continue.",
        })
        return
      }

      const url = selectedTerm ? `/api/terms/${selectedTerm.id}` : "/api/terms"
      const method = selectedTerm ? "PUT" : "POST"

      console.log(`Submitting term data to ${url} with method ${method}`)
      console.log("Form data:", formData)

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

      const responseText = await response.text()
      console.log(`API Response (${response.status}):`, responseText)

      if (!response.ok) {
        let errorMessage = "Unknown error occurred"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || `Failed to ${selectedTerm ? "update" : "create"} term`
        } catch (e) {
          errorMessage = `Server returned: ${responseText}`
        }
        throw new Error(errorMessage)
      }

      let updatedTerm
      try {
        updatedTerm = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Invalid response from server")
      }

      console.log("Term data response:", updatedTerm)

      // If setting a term to active, update all other terms in the UI to inactive
      if (formData.status === "Active") {
        setTerms((prev) =>
          prev.map((term) => {
            if (selectedTerm && term.id === selectedTerm.id) {
              return updatedTerm
            }
            return { ...term, status: "Inactive" }
          }),
        )
      } else if (selectedTerm) {
        // Just update the specific term
        setTerms((prev) => prev.map((term) => (term.id === selectedTerm.id ? updatedTerm : term)))
      } else {
        // Add new term to the list
        if (formData.status === "Active") {
          // If new term is active, set all others to inactive
          setTerms((prev) => [updatedTerm, ...prev.map((term) => ({ ...term, status: "Inactive" }))])
        } else {
          setTerms((prev) => [updatedTerm, ...prev])
        }
      }

      toast({
        title: "Success",
        description: `Term ${selectedTerm ? "updated" : "created"} successfully`,
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error submitting term:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${selectedTerm ? "update" : "create"} term. ${error instanceof Error ? error.message : "Please try again."}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedTerm) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to continue.",
        })
        return
      }

      console.log(`Deleting term with ID: ${selectedTerm.id}`)
      const response = await fetch(`/api/terms/${selectedTerm.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete term")
      }

      // Remove deleted term from the list
      setTerms((prev) => prev.filter((term) => term.id !== selectedTerm.id))

      toast({
        title: "Success",
        description: "Term deleted successfully",
      })

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting term:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete term. ${error instanceof Error ? error.message : "Please try again."}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is null (not authenticated) and auth is not loading, redirect to login
  if (!authLoading && !user) {
    router.push("/login")
    return null
  }

  const filteredTerms = terms.filter(
    (term) => term.termName?.toLowerCase().includes(searchTerm.toLowerCase()) || term.year?.includes(searchTerm),
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Terms</h1>
        <Button onClick={handleCreateTerm}>
          <Plus className="mr-2 h-4 w-4" /> Add New Term
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? "No terms match your search" : "No terms found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Next Term Starts</TableHead>
                    <TableHead>Next Term Ends</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.termName}</TableCell>
                      <TableCell>{term.year}</TableCell>
                      <TableCell>
                        {term.nextTermStarts ? format(new Date(term.nextTermStarts), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {term.nextTermEnds ? format(new Date(term.nextTermEnds), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={term.status === "Active" ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {term.status === "Active" && <CheckCircle className="h-3 w-3" />}
                          {term.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditTerm(term)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteTerm(term)}
                            disabled={term.status === "Active"}
                            title={term.status === "Active" ? "Cannot delete active term" : "Delete term"}
                          >
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

      {/* Create/Edit Term Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedTerm ? "Edit Term" : "Create New Term"}</DialogTitle>
            <DialogDescription>
              {selectedTerm ? "Update the term details below" : "Fill in the term details below"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="termName" className="text-sm font-medium">
                Term Name
              </label>
              <Input
                id="termName"
                name="termName"
                value={formData.termName}
                onChange={handleInputChange}
                placeholder="e.g. First Term, Second Term"
              />
              {formErrors.termName && <p className="text-sm text-red-500">{formErrors.termName}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="year" className="text-sm font-medium">
                Academic Year
              </label>
              <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="e.g. 2025" />
              {formErrors.year && <p className="text-sm text-red-500">{formErrors.year}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="nextTermStarts" className="text-sm font-medium">
                Next Term Starts
              </label>
              <Input
                id="nextTermStarts"
                name="nextTermStarts"
                type="date"
                value={formData.nextTermStarts}
                onChange={handleInputChange}
              />
              {formErrors.nextTermStarts && <p className="text-sm text-red-500">{formErrors.nextTermStarts}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="nextTermEnds" className="text-sm font-medium">
                Next Term Ends
              </label>
              <Input
                id="nextTermEnds"
                name="nextTermEnds"
                type="date"
                value={formData.nextTermEnds}
                onChange={handleInputChange}
              />
              {formErrors.nextTermEnds && <p className="text-sm text-red-500">{formErrors.nextTermEnds}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange(value, "status")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === "Active" && (
                <p className="text-xs text-amber-600">
                  Note: Setting this term as active will automatically set all other terms to inactive.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedTerm ? "Update Term" : "Create Term"}
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
              This action cannot be undone. This will permanently delete the term &quot;{selectedTerm?.termName}&quot;.
              {selectedTerm?.status === "Active" && (
                <p className="mt-2 text-red-500 font-semibold">
                  You cannot delete an active term. Please set another term as active first.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isSubmitting || selectedTerm?.status === "Active"}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
