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
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Parent {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  students: Student[]
}

interface Student {
  id: string
  name: string
  rollNum: string
  sclass: {
    id: string
    sclassName: string
  }
}

export default function AdminParents() {
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
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

        // Fetch students
        const studentsResponse = await fetch(`/api/students?schoolId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setStudents(studentsData)
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
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch parents",
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

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleAddParent = async () => {
    if (!formData.name || !formData.email || !formData.password) {
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

      const response = await fetch("/api/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          studentIds: selectedStudentIds,
          schoolId: user?.id,
        }),
      })

      if (response.ok) {
        const newParent = await response.json()

        // Add the new parent to the list
        setParents((prev) => [...prev, newParent])

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          password: "",
        })
        setSelectedStudentIds([])

        setIsAddDialogOpen(false)

        toast({
          title: "Success",
          description: "Parent added successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to add parent",
        })
      }
    } catch (error) {
      console.error("Add parent error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while adding parent",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditParent = async () => {
    if (!selectedParent || !formData.name || !formData.email) {
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

      const response = await fetch(`/api/parents/${selectedParent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          studentIds: selectedStudentIds,
          ...(formData.password && { password: formData.password }),
        }),
      })

      if (response.ok) {
        const updatedParent = await response.json()

        // Update the parent in the list
        setParents((prev) => prev.map((parent) => (parent.id === selectedParent.id ? updatedParent : parent)))

        setIsEditDialogOpen(false)

        toast({
          title: "Success",
          description: "Parent updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update parent",
        })
      }
    } catch (error) {
      console.error("Edit parent error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating parent",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteParent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this parent?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`/api/parents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove the parent from the list
        setParents((prev) => prev.filter((parent) => parent.id !== id))

        toast({
          title: "Success",
          description: "Parent deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete parent",
        })
      }
    } catch (error) {
      console.error("Delete parent error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting parent",
      })
    }
  }

  const openEditDialog = (parent: Parent) => {
    setSelectedParent(parent)
    setFormData({
      name: parent.name,
      email: parent.email,
      phone: parent.phone || "",
      address: parent.address || "",
      password: "",
    })
    setSelectedStudentIds(parent.students.map((student) => student.id))
    setIsEditDialogOpen(true)
  }

  // Filter parents based on search term
  const filteredParents = parents.filter(
    (parent) =>
      parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parent.phone && parent.phone.includes(searchTerm)),
  )

  return (
    <DashboardLayout title="Parent Management" requiredRole="Admin">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Parents</h2>
          <p className="text-sm text-muted-foreground">Manage parent accounts and student associations.</p>
        </div>
        <div className="flex mt-4 md:mt-0">
          <div className="relative mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search parents..."
              className="w-full md:w-[200px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Parent
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parents</CardTitle>
          <CardDescription>View and manage parent accounts and their associated students.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
              <div className="h-64 w-full animate-pulse rounded bg-muted"></div>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No parents found.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Parent
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium">{parent.name}</TableCell>
                      <TableCell>{parent.email}</TableCell>
                      <TableCell>{parent.phone || "Not provided"}</TableCell>
                      <TableCell>
                        {parent.students.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {parent.students.map((student) => (
                              <span
                                key={student.id}
                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                              >
                                {student.name} ({student.sclass.sclassName})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No children</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(parent)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteParent(parent.id)}>
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

      {/* Add Parent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
            <DialogDescription>Enter the parent's details to create a new account.</DialogDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="parent@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="space-y-2">
              <Label>Children</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students available</p>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => handleStudentSelection(student.id)}
                      />
                      <Label htmlFor={`student-${student.id}`} className="text-sm font-normal">
                        {student.name} ({student.rollNum}) - {student.sclass.sclassName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParent} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Parent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription>Update the parent's information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" name="phone" value={formData.phone} onChange={handleInputChange} />
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
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label>Children</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students available</p>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`edit-student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => handleStudentSelection(student.id)}
                      />
                      <Label htmlFor={`edit-student-${student.id}`} className="text-sm font-normal">
                        {student.name} ({student.rollNum}) - {student.sclass.sclassName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditParent} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
