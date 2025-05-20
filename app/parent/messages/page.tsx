"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, RefreshCw, MessageSquare } from "lucide-react"

interface Message {
  id: string
  sender: {
    id: string
    name: string
    role: string
  }
  recipient: {
    id: string
    name: string
    role: string
  }
  subject: string
  content: string
  read: boolean
  createdAt: string
}

interface Teacher {
  id: string
  name: string
  email: string
}

export default function ParentMessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inbox")
  const [replyContent, setReplyContent] = useState("")
  const [newMessage, setNewMessage] = useState({
    recipientId: "",
    subject: "",
    content: "",
  })

  useEffect(() => {
    if (user) {
      fetchMessages()
      fetchTeachers()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages?userId=${user?.id}&role=Parent`)
      if (!response.ok) throw new Error("Failed to fetch messages")

      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`/api/teachers?schoolId=${user?.schoolId}`)
      if (!response.ok) throw new Error("Failed to fetch teachers")

      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) throw new Error("Failed to mark message as read")

      setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const handleSendMessage = async () => {
    try {
      if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
        toast({
          title: "Missing information",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          senderId: user?.id,
          recipientId: newMessage.recipientId,
          subject: newMessage.subject,
          content: newMessage.content,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      toast({
        title: "Success",
        description: "Message sent successfully",
      })

      setNewMessageOpen(false)
      setNewMessage({
        recipientId: "",
        subject: "",
        content: "",
      })
      fetchMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReply = async () => {
    if (!selectedMessage || !replyContent) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          senderId: user?.id,
          recipientId: selectedMessage.sender.id,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
        }),
      })

      if (!response.ok) throw new Error("Failed to send reply")

      toast({
        title: "Success",
        description: "Reply sent successfully",
      })

      setReplyContent("")
      fetchMessages()
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "inbox") {
      return matchesSearch && message.recipient.id === user?.id
    } else if (activeTab === "sent") {
      return matchesSearch && message.sender.id === user?.id
    } else if (activeTab === "unread") {
      return matchesSearch && message.recipient.id === user?.id && !message.read
    }

    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Communicate with your child's teachers and school staff</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setNewMessageOpen(true)}>
          New Message
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="inbox" className="mb-4" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="h-[calc(100vh-300px)]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedMessage?.id === message.id ? "border-primary" : ""
                    } ${!message.read && message.recipient.id === user?.id ? "bg-accent/20" : ""}`}
                    onClick={() => {
                      setSelectedMessage(message)
                      if (!message.read && message.recipient.id === user?.id) {
                        markAsRead(message.id)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {activeTab === "sent" ? message.recipient.name.charAt(0) : message.sender.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium truncate">
                              {activeTab === "sent" ? `To: ${message.recipient.name}` : message.sender.name}
                            </p>
                            <div className="flex items-center">
                              {!message.read && message.recipient.id === user?.id && (
                                <Badge variant="default" className="mr-2">
                                  New
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(message.createdAt).split(",")[0]}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium truncate">{message.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{message.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="w-full md:w-2/3">
          {selectedMessage ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{selectedMessage.sender.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>
                        {selectedMessage.sender.name} ({selectedMessage.sender.role})
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{formatDate(selectedMessage.createdAt)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => fetchMessages()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {selectedMessage.recipient.id === user?.id && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-2">Reply</h3>
                    <Textarea
                      placeholder="Write your reply..."
                      className="min-h-[120px]"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Button className="mt-4" onClick={handleReply} disabled={!replyContent.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No message selected</h3>
                <p className="text-muted-foreground mt-2">Select a message from the list to view its contents</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Send a message to your child's teacher or school staff</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="recipient" className="text-sm font-medium">
                Recipient
              </label>
              <Select
                value={newMessage.recipientId}
                onValueChange={(value) => setNewMessage({ ...newMessage, recipientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} (Teacher)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Message subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="content" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="content"
                placeholder="Write your message..."
                className="min-h-[150px]"
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
