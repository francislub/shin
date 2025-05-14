"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Paperclip, Send, Trash, Users } from "lucide-react"

interface EmailRecipient {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminEmail() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [recipientType, setRecipientType] = useState("")
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sentEmails, setSentEmails] = useState<any[]>([])
  const { toast } = useToast()

  // Mock data for recipients
  const recipients: EmailRecipient[] = [
    { id: "1", name: "John Doe", email: "john.doe@example.com", role: "Teacher" },
    { id: "2", name: "Jane Smith", email: "jane.smith@example.com", role: "Teacher" },
    { id: "3", name: "Alice Johnson", email: "alice.johnson@example.com", role: "Student" },
    { id: "4", name: "Bob Brown", email: "bob.brown@example.com", role: "Student" },
    { id: "5", name: "Carol White", email: "carol.white@example.com", role: "Parent" },
    { id: "6", name: "David Green", email: "david.green@example.com", role: "Parent" },
  ]

  const filteredRecipients = recipientType
    ? recipients.filter((recipient) => recipient.role === recipientType)
    : recipients

  const handleSelectRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((recipientId) => recipientId !== id) : [...prev, id],
    )
  }

  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(filteredRecipients.map((recipient) => recipient.id))
    }
  }

  const handleSendEmail = async () => {
    if (!subject || !message || selectedRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields and select at least one recipient.",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real implementation, you would call an API to send the email
      // For now, we'll just simulate a successful email send
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const selectedRecipientsData = recipients.filter((recipient) => selectedRecipients.includes(recipient.id))

      // Add to sent emails
      setSentEmails((prev) => [
        {
          id: Date.now().toString(),
          subject,
          recipients: selectedRecipientsData,
          date: new Date().toISOString(),
        },
        ...prev,
      ])

      // Reset form
      setSubject("")
      setMessage("")
      setSelectedRecipients([])

      toast({
        title: "Success",
        description: "Email sent successfully.",
      })
    } catch (error) {
      console.error("Send email error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while sending the email.",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <DashboardLayout title="Email Communication" requiredRole="Admin">
      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="sent">Sent Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Send emails to teachers, students, and parents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient-type">Recipient Type</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger id="recipient-type">
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Teacher">Teachers</SelectItem>
                      <SelectItem value="Student">Students</SelectItem>
                      <SelectItem value="Parent">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Recipients</Label>
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedRecipients.length === filteredRecipients.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                    {filteredRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recipients available</p>
                    ) : (
                      filteredRecipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id={`recipient-${recipient.id}`}
                            checked={selectedRecipients.includes(recipient.id)}
                            onChange={() => handleSelectRecipient(recipient.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`recipient-${recipient.id}`} className="text-sm font-normal">
                            {recipient.name} ({recipient.email}) - {recipient.role}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message"
                    rows={8}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" type="button">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach File
                  </Button>
                  <Button onClick={handleSendEmail} disabled={isLoading}>
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Emails</CardTitle>
              <CardDescription>View all sent emails.</CardDescription>
            </CardHeader>
            <CardContent>
              {sentEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No emails sent yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.subject}</TableCell>
                        <TableCell>
                          {email.recipients.length} recipient{email.recipients.length !== 1 && "s"}
                        </TableCell>
                        <TableCell>{formatDate(email.date)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
