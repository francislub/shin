"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Search, Plus, Trash2, Loader2, Eye } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  subject: string
  message: string
  sender: {
    id: string
    name: string
    email?: string
  }
  recipient: {
    id: string
    name: string
    email?: string
  }
  status: string
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  name: string
  email?: string
  role: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    recipientId: "",
  })
  const [formErrors, setFormErrors] = useState({
    subject: "",
    message: "",
    recipientId: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!user) return

        const token = localStorage.getItem("token")
        const schoolId = localStorage.getItem("schoolId")

        if (!token || !schoolId) {
          setIsLoading(false)
          return
        }

        // Fetch messages
        const messagesResponse = await fetch(`/api/messages?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!messagesResponse.ok) {
          throw new Error("Failed to fetch messages")
        }

        const messagesData = await messagesResponse.json()
        setMessages(messagesData)

        // Fetch users for recipient selection
        const usersResponse = await fetch(`/api/users?schoolId=${schoolId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users")
        }

        const usersData = await usersResponse.json()
        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load messages. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [user, toast])

  const validateForm = () => {
    const errors = {
      subject: "",
      message: "",
      recipientId: "",
    }
    let isValid = true

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required"
      isValid = false
    } else if (formData.subject.length < 3) {
      errors.subject = "Subject must be at least 3 characters"
      isValid = false
    } else if (formData.subject.length > 100) {
      errors.subject = "Subject must be less than 100 characters"
      isValid = false
    }

    if (!formData.message.trim()) {
      errors.message = "Message is required"
      isValid = false
    } else if (formData.message.length < 10) {
      errors.message = "Message must be at least 10 characters"
      isValid = false
    }

    if (!formData.recipientId) {
      errors.recipientId = "Recipient is required"
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

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user selects
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleCreateMessage = () => {
    setSelectedMessage(null)
    setFormData({
      subject: "",
      message: "",
      recipientId: "",
    })
    setFormErrors({
      subject: "",
      message: "",
      recipientId: "",
    })
    setIsDialogOpen(true)
  }

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message)
    setIsViewDialogOpen(true)
  }

  const handleDeleteMessage = (message: Message) => {
    setSelectedMessage(message)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")

      if (!token || !schoolId || !user) {
        throw new Error("Authentication failed")
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          senderId: user.id,
          schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()

      // Add new message to the list
      setMessages((prev) => [newMessage, ...prev])

      toast({
        title: "Success",
        description: "Message sent successfully",
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedMessage) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication failed")
      }

      const response = await fetch(`/api/messages/${selectedMessage.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete message")
      }

      // Remove deleted message from the list
      setMessages((prev) => prev.filter((message) => message.id !== selectedMessage.id))

      toast({
        title: "Success",
        description: "Message deleted successfully",
      })

      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete message. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMessages = messages.filter(
    (message) =>
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button onClick={handleCreateMessage}>
          <Plus className="mr-2 h-4 w-4" /> New Message
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? "No messages match your search" : "No messages found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.subject}</TableCell>
                      <TableCell>{message.sender.name}</TableCell>
                      <TableCell>{message.recipient.name}</TableCell>
                      <TableCell>{format(new Date(message.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={message.status === "Read" ? "outline" : "default"}>{message.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleViewMessage(message)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteMessage(message)}
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

      {/* Create Message Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send New Message</DialogTitle>
            <DialogDescription>Compose a new message to send to a user</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="recipientId" className="text-sm font-medium">
                Recipient
              </label>
              <Select value={formData.recipientId} onValueChange={(value) => handleSelectChange(value, "recipientId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.recipientId && <p className="text-sm text-red-500">{formErrors.recipientId}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter message subject"
              />
              {formErrors.subject && <p className="text-sm text-red-500">{formErrors.subject}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message"
                rows={5}
              />
              {formErrors.message && <p className="text-sm text-red-500">{formErrors.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedMessage?.sender.name} • To: {selectedMessage?.recipient.name} •{" "}
              {selectedMessage && format(new Date(selectedMessage.createdAt), "MMM d, yyyy h:mm a")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md whitespace-pre-wrap">
              {selectedMessage?.message}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message &quot;{selectedMessage?.subject}
              &quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isSubmitting}
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
