"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface Complaint {
  id: string
  title: string
  description: string
  date: string
  status: "pending" | "in-progress" | "resolved" | "rejected"
  response?: string
}

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewComplaintDialogOpen, setIsNewComplaintDialogOpen] = useState(false)
  const [isViewComplaintDialogOpen, setIsViewComplaintDialogOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [newComplaintTitle, setNewComplaintTitle] = useState("")
  const [newComplaintDescription, setNewComplaintDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/student/complaints", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setComplaints(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch complaints",
          })
        }
      } catch (error) {
        console.error("Complaints error:", error)
        // Fallback to sample data if API fails
        setComplaints([
          {
            id: "1",
            title: "Classroom Ventilation Issue",
            description:
              "The air conditioning in Room 203 has not been working properly for the past week. The room gets very hot during afternoon classes, making it difficult to concentrate.",
            date: "2023-11-10",
            status: "in-progress",
            response: "We have notified the maintenance department. A technician will check the AC unit tomorrow.",
          },
          {
            id: "2",
            title: "Missing Library Book",
            description:
              "I returned 'Introduction to Calculus' on November 5th, but it's still showing as checked out in my account. I have the receipt of return.",
            date: "2023-11-07",
            status: "resolved",
            response:
              "Thank you for reporting this. We have updated our records and the book is no longer showing as checked out in your account.",
          },
          {
            id: "3",
            title: "Cafeteria Food Quality",
            description:
              "The food quality in the cafeteria has deteriorated over the past month. Many students have complained about cold food and limited vegetarian options.",
            date: "2023-11-01",
            status: "pending",
          },
          {
            id: "4",
            title: "Bullying Incident",
            description:
              "I would like to report a bullying incident that occurred on October 25th in the school playground during lunch break.",
            date: "2023-10-26",
            status: "rejected",
            response:
              "After investigation, we found no evidence to support this claim. Please provide more specific details if you wish to reopen this complaint.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplaints()
  }, [toast])

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsViewComplaintDialogOpen(true)
  }

  const handleDeleteComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsDeleteAlertOpen(true)
  }

  const confirmDeleteComplaint = async () => {
    if (!selectedComplaint) return

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      // In a real app, you would call the API to delete the complaint
      // For now, we'll just update the local state
      setComplaints((prevComplaints) => prevComplaints.filter((complaint) => complaint.id !== selectedComplaint.id))

      toast({
        title: "Complaint deleted",
        description: "Your complaint has been deleted successfully.",
      })

      // Simulate API call
      // const response = await fetch(`/api/student/complaints/${selectedComplaint.id}`, {
      //   method: "DELETE",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // })

      // if (!response.ok) {
      //   throw new Error("Failed to delete complaint")
      // }
    } catch (error) {
      console.error("Delete complaint error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete complaint",
      })
    } finally {
      setIsDeleteAlertOpen(false)
      setSelectedComplaint(null)
    }
  }

  const handleSubmitNewComplaint = async () => {
    if (!newComplaintTitle.trim() || !newComplaintDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      // In a real app, you would call the API to create a new complaint
      // For now, we'll just update the local state
      const newComplaint: Complaint = {
        id: Date.now().toString(),
        title: newComplaintTitle,
        description: newComplaintDescription,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      }

      setComplaints((prevComplaints) => [newComplaint, ...prevComplaints])

      toast({
        title: "Complaint submitted",
        description: "Your complaint has been submitted successfully.",
      })

      // Reset form
      setNewComplaintTitle("")
      setNewComplaintDescription("")
      setIsNewComplaintDialogOpen(false)

      // Simulate API call
      // const response = await fetch("/api/student/complaints", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     title: newComplaintTitle,
      //     description: newComplaintDescription,
      //   }),
      // })

      // if (!response.ok) {
      //   throw new Error("Failed to submit complaint")
      // }
    } catch (error) {
      console.error("Submit complaint error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit complaint",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const activeComplaints = complaints.filter(
    (complaint) => complaint.status === "pending" || complaint.status === "in-progress",
  )
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "resolved" || complaint.status === "rejected",
  )

  return (
    <DashboardLayout title="Complaints & Feedback" requiredRole="Student">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">My Complaints</h2>
          <p className="text-sm text-muted-foreground">Submit and track your complaints</p>
        </div>
        <Button onClick={() => setIsNewComplaintDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Complaint
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active
            {activeComplaints.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {activeComplaints.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="h-6 w-3/4 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full animate-pulse rounded bg-muted mb-2"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))
            ) : activeComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active complaints.</p>
              </div>
            ) : (
              activeComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      {getStatusBadge(complaint.status)}
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(complaint.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleDeleteComplaint(complaint)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                    <Button size="sm" onClick={() => handleViewComplaint(complaint)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="h-6 w-3/4 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full animate-pulse rounded bg-muted mb-2"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))
            ) : resolvedComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No resolved complaints.</p>
              </div>
            ) : (
              resolvedComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      {getStatusBadge(complaint.status)}
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(complaint.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button size="sm" onClick={() => handleViewComplaint(complaint)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Complaint Dialog */}
      <Dialog open={isNewComplaintDialogOpen} onOpenChange={setIsNewComplaintDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit New Complaint</DialogTitle>
            <DialogDescription>
              Provide details about your complaint. Be specific and include relevant information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief title for your complaint"
                value={newComplaintTitle}
                onChange={(e) => setNewComplaintTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your complaint"
                rows={5}
                value={newComplaintDescription}
                onChange={(e) => setNewComplaintDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewComplaintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNewComplaint} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Complaint Dialog */}
      <Dialog open={isViewComplaintDialogOpen} onOpenChange={setIsViewComplaintDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {selectedComplaint && formatDate(selectedComplaint.date)}
              </span>
              <span>{selectedComplaint && getStatusBadge(selectedComplaint.status)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-foreground whitespace-pre-line">{selectedComplaint?.description}</p>
            </div>
            {selectedComplaint?.response && (
              <div className="space-y-2 rounded-md border p-4">
                <h4 className="text-sm font-medium">Response</h4>
                <p className="text-sm text-foreground whitespace-pre-line">{selectedComplaint.response}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewComplaintDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your complaint. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteComplaint} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
