"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { PlusCircle, Send, User } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
  id: string
  subject: string
  content: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  recipientType: string
  createdAt: string
  read: boolean
}

interface Recipient {
  id: string
  name: string
  type: string
}

export default function TeacherMessagesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [sentMessages, setSentMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [recipientType, setRecipientType] = useState<string>("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (token) {
      fetchMessages()
    }
  }, [token])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      // Fetch received messages
      const receivedResponse = await fetch(`/api/messages?recipientId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!receivedResponse.ok) {
        throw new Error("Failed to fetch received messages")
      }

      const receivedData = await receivedResponse.json()
      setMessages(receivedData)

      // Fetch sent messages
      const sentResponse = await fetch(`/api/messages?senderId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!sentResponse.ok) {
        throw new Error("Failed to fetch sent messages")
      }

      const sentData = await sentResponse.json()
      setSentMessages(sentData)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async (type: string) => {
    try {
      let endpoint = ""

      switch (type) {
        case "student":
          // Only fetch students from classes the teacher teaches
          endpoint = `/api/students?teacherId=${user?.id}`
          break
        case "parent":
          // Only fetch parents of students in classes the teacher teaches
          endpoint = `/api/parents?teacherId=${user?.id}`
          break
        case "admin":
          endpoint = `/api/admins?schoolId=${user?.schoolId}`
          break
        default:
          return
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}s`)
      }

      const data = await response.json()

      // Format recipients based on the type
      const formattedRecipients = data.map((item: any) => ({
        id: item.id,
        name: `${item.firstName} ${item.lastName}`,
        type,
      }))

      setRecipients(formattedRecipients)
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error)
      toast({
        title: "Error",
        description: `Failed to load ${type}s. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleRecipientTypeChange = (value: string) => {
    setRecipientType(value)
    setSelectedRecipient("")
    fetchRecipients(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !content || !recipientType || !selectedRecipient) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const selectedRecipientObj = recipients.find((r) => r.id === selectedRecipient)

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          content,
          senderId: user?.id,
          senderName: `${user?.firstName} ${user?.lastName}`,
          senderType: "Teacher",
          recipientId: selectedRecipient,
          recipientName: selectedRecipientObj?.name,
          recipientType: recipientType,
          schoolId: user?.schoolId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      toast({
        title: "Success",
        description: "Message sent successfully",
      })
      setOpen(false)
      setSubject("")
      setContent("")
      setRecipientType("")
      setSelectedRecipient("")
      fetchMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/messages/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to mark message as read")
      }

      // Update the local state
      setMessages(messages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg)))
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>New Message</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
              <DialogDescription>Send a message to students, parents, or administrators.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="recipientType">Recipient Type</Label>
                  <Select value={recipientType} onValueChange={handleRecipientTypeChange}>
                    <SelectTrigger id="recipientType">
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientType && (
                  <div className="grid gap-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select
                      value={selectedRecipient}
                      onValueChange={setSelectedRecipient}
                      disabled={recipients.length === 0}
                    >
                      <SelectTrigger id="recipient">
                        <SelectValue
                          placeholder={
                            recipients.length === 0 ? `No ${recipientType}s available` : `Select ${recipientType}`
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter message subject"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your message"
                    required
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Separator />

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="space-y-1">
                        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">No messages found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Your inbox is empty. Messages from students, parents, and administrators will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={cn("transition-colors hover:bg-accent/5", !message.read && "border-l-4 border-l-primary")}
                  onClick={() => !message.read && markAsRead(message.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{message.subject}</CardTitle>
                        <CardDescription>
                          From: {message.senderName} • {format(new Date(message.createdAt), "PPp")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(true)
                        setRecipientType(message.recipientType.toLowerCase())
                        fetchRecipients(message.recipientType.toLowerCase())
                        setSelectedRecipient(message.senderId)
                        setSubject(`Re: ${message.subject}`)
                        setContent(`\n\n-------- Original Message --------\n${message.content}`)
                      }}
                    >
                      Reply
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="space-y-1">
                        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sentMessages.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h3 className="mt-4 text-lg font-semibold">No sent messages</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't sent any messages yet. Create a new message to get started.
              </p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>New Message</Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {sentMessages.map((message) => (
                <Card key={message.id} className="transition-colors hover:bg-accent/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(message.recipientName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{message.subject}</CardTitle>
                        <CardDescription>
                          To: {message.recipientName} • {format(new Date(message.createdAt), "PPp")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
