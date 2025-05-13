"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, User, Users } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface Contact {
  id: string
  name: string
  role: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  avatar?: string
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
}

export default function AdminMessages() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // In a real implementation, you would fetch contacts from an API
        // For now, we'll use mock data
        const mockContacts: Contact[] = [
          {
            id: "1",
            name: "John Doe",
            role: "Teacher",
            lastMessage: "When is the next staff meeting?",
            lastMessageTime: "2023-05-15T10:30:00Z",
            unread: 2,
          },
          {
            id: "2",
            name: "Jane Smith",
            role: "Teacher",
            lastMessage: "I've uploaded the exam results.",
            lastMessageTime: "2023-05-14T15:45:00Z",
            unread: 0,
          },
          {
            id: "3",
            name: "Alice Johnson",
            role: "Student",
            lastMessage: "Thank you for your help with the project.",
            lastMessageTime: "2023-05-13T09:20:00Z",
            unread: 0,
          },
          {
            id: "4",
            name: "Bob Brown",
            role: "Parent",
            lastMessage: "Can we schedule a meeting to discuss my child's progress?",
            lastMessageTime: "2023-05-12T14:10:00Z",
            unread: 1,
          },
        ]

        setContacts(mockContacts)
        setIsLoading(false)
      } catch (error) {
        console.error("Fetch contacts error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch contacts.",
        })
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [toast])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
    }
  }, [selectedContact])

  const fetchMessages = async (contactId: string) => {
    try {
      // In a real implementation, you would fetch messages from an API
      // For now, we'll use mock data
      const mockMessages: Message[] = [
        {
          id: "1",
          senderId: "admin",
          receiverId: contactId,
          content: "Hello, how can I help you?",
          timestamp: "2023-05-15T10:25:00Z",
          read: true,
        },
        {
          id: "2",
          senderId: contactId,
          receiverId: "admin",
          content: "When is the next staff meeting?",
          timestamp: "2023-05-15T10:30:00Z",
          read: false,
        },
        {
          id: "3",
          senderId: "admin",
          receiverId: contactId,
          content: "The next staff meeting is scheduled for Friday at 2 PM.",
          timestamp: "2023-05-15T10:35:00Z",
          read: true,
        },
      ]

      setMessages(mockMessages)

      // Mark messages as read
      setContacts((prevContacts) =>
        prevContacts.map((contact) => (contact.id === contactId ? { ...contact, unread: 0 } : contact)),
      )
    } catch (error) {
      console.error("Fetch messages error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch messages.",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return

    try {
      // In a real implementation, you would send the message to an API
      // For now, we'll just add it to the local state
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: "admin",
        receiverId: selectedContact.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: true,
      }

      setMessages((prevMessages) => [...prevMessages, newMsg])
      setNewMessage("")

      // Update last message in contacts
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === selectedContact.id
            ? {
                ...contact,
                lastMessage: newMessage,
                lastMessageTime: new Date().toISOString(),
              }
            : contact,
        ),
      )
    } catch (error) {
      console.error("Send message error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      })
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <DashboardLayout title="Messages" requiredRole="Admin">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Contacts List */}
        <Card className="md:col-span-1">
          <CardHeader className="p-4">
            <CardTitle>Contacts</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contacts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No contacts found</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center space-x-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedContact?.id === contact.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar>
                        <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{contact.name}</p>
                          <span className="text-xs text-muted-foreground">{formatDate(contact.lastMessageTime)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                          {contact.unread > 0 && (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedContact ? (
            <>
              <CardHeader className="p-4 border-b">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={selectedContact.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedContact.name}</CardTitle>
                    <CardDescription>{selectedContact.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[calc(100vh-20rem)]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">{formatTime(message.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} className="self-end">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No conversation selected</h3>
              <p className="text-muted-foreground">Select a contact to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
