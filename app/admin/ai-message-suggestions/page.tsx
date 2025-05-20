"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageCircleMore, Copy, Download, Send, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AIMessageSuggestions() {
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState("")
  const [messageType, setMessageType] = useState("general_notice")
  const [messageTemplate, setMessageTemplate] = useState("")
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])
  const { toast } = useToast()

  // Function to generate message template
  const generateTemplate = async () => {
    if (!context) {
      toast({
        title: "Input Required",
        description: "Please provide context for the message.",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/ai/message-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context,
          messageType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate message template")
      }

      const data = await response.json()
      setMessageTemplate(data.messageTemplate)

      toast({
        title: "Template Generated",
        description: "Message template has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating template:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate message template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Function to copy template to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageTemplate)
    toast({
      title: "Copied",
      description: "Message template copied to clipboard.",
    })
  }

  // Function to save template
  const saveTemplate = () => {
    if (!messageTemplate) return

    const newTemplate = {
      id: Date.now().toString(),
      type: messageType,
      content: messageTemplate,
      createdAt: new Date().toISOString(),
    }

    setSavedTemplates([newTemplate, ...savedTemplates])

    toast({
      title: "Template Saved",
      description: "Message template has been saved to your library.",
    })
  }

  // Function to get message type label
  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "attendance_warning":
        return "Attendance Warning"
      case "academic_improvement":
        return "Academic Improvement"
      case "positive_feedback":
        return "Positive Feedback"
      case "event_announcement":
        return "Event Announcement"
      case "parent_meeting":
        return "Parent Meeting"
      case "exam_reminder":
        return "Exam Reminder"
      case "fee_reminder":
        return "Fee Reminder"
      case "general_notice":
        return "General Notice"
      case "behavior_concern":
        return "Behavior Concern"
      case "achievement_recognition":
        return "Achievement Recognition"
      default:
        return type
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }

  // Function to get badge variant based on message type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "attendance_warning":
      case "behavior_concern":
        return "destructive"
      case "academic_improvement":
      case "fee_reminder":
        return "outline"
      case "positive_feedback":
      case "achievement_recognition":
        return "default"
      case "event_announcement":
      case "exam_reminder":
        return "secondary"
      case "parent_meeting":
      case "general_notice":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <DashboardLayout title="AI Message Suggestions" requiredRole="Admin">
      <div className="space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AI-Powered Message Generator</CardTitle>
            <CardDescription>
              Use artificial intelligence to generate professional message templates for various purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Type</label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance_warning">Attendance Warning</SelectItem>
                    <SelectItem value="academic_improvement">Academic Improvement</SelectItem>
                    <SelectItem value="positive_feedback">Positive Feedback</SelectItem>
                    <SelectItem value="event_announcement">Event Announcement</SelectItem>
                    <SelectItem value="parent_meeting">Parent Meeting</SelectItem>
                    <SelectItem value="exam_reminder">Exam Reminder</SelectItem>
                    <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                    <SelectItem value="general_notice">General Notice</SelectItem>
                    <SelectItem value="behavior_concern">Behavior Concern</SelectItem>
                    <SelectItem value="achievement_recognition">Achievement Recognition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Context</label>
                <Textarea
                  placeholder="Provide context for the message (e.g., student name, class, specific situation, etc.)"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button className="w-full" onClick={generateTemplate} disabled={generating || !context}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageCircleMore className="mr-2 h-4 w-4" />
                    Generate Message
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="generated" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generated">
              <MessageCircleMore className="mr-2 h-4 w-4" />
              Generated Template
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Send className="mr-2 h-4 w-4" />
              Saved Templates
            </TabsTrigger>
          </TabsList>
          <TabsContent value="generated">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Generated Message Template</CardTitle>
                <CardDescription>AI-generated message template based on your input</CardDescription>
              </CardHeader>
              <CardContent>
                {messageTemplate ? (
                  <div className="space-y-4">
                    <Badge variant={getBadgeVariant(messageType)}>{getMessageTypeLabel(messageType)}</Badge>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="whitespace-pre-line">{messageTemplate}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                      <MessageCircleMore className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Generated message will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContext("")
                    setMessageTemplate("")
                  }}
                  disabled={!messageTemplate}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!messageTemplate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="default" size="sm" onClick={saveTemplate} disabled={!messageTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="saved">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
                <CardDescription>Your library of saved message templates</CardDescription>
              </CardHeader>
              <CardContent>
                {savedTemplates.length > 0 ? (
                  <div className="space-y-4">
                    {savedTemplates.map((template) => (
                      <div key={template.id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant={getBadgeVariant(template.type)}>{getMessageTypeLabel(template.type)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-sm">{template.content}</p>
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(template.content)
                              toast({
                                title: "Copied",
                                description: "Template copied to clipboard.",
                              })
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                      <Send className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No saved templates yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
