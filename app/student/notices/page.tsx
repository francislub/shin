"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Notice {
  id: string
  title: string
  details: string
  date: string
  isRead: boolean
  category: "academic" | "event" | "general" | "important"
}

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/student/notices", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setNotices(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch notices",
          })
        }
      } catch (error) {
        console.error("Notices error:", error)
        // Fallback to sample data if API fails
        setNotices([
          {
            id: "1",
            title: "End of Term Examination Schedule",
            details:
              "The end of term examinations will begin on December 10th, 2023. Please check the attached schedule for your examination dates and times. All students are required to arrive at least 30 minutes before the scheduled examination time.",
            date: "2023-11-15",
            isRead: false,
            category: "academic",
          },
          {
            id: "2",
            title: "Annual Sports Day",
            details:
              "The annual sports day will be held on November 25th, 2023 at the school grounds. All students are encouraged to participate in at least one event. Registration for events will close on November 20th.",
            date: "2023-11-10",
            isRead: true,
            category: "event",
          },
          {
            id: "3",
            title: "Library Book Return Reminder",
            details:
              "All library books must be returned by December 1st, 2023. Students with overdue books will not receive their end of term report cards until all books are returned or fines are paid.",
            date: "2023-11-05",
            isRead: false,
            category: "general",
          },
          {
            id: "4",
            title: "School Closure Due to Weather",
            details:
              "Due to the severe weather forecast for tomorrow, the school will remain closed on November 2nd, 2023. Classes will resume on November 3rd, 2023. Stay safe and warm.",
            date: "2023-11-01",
            isRead: true,
            category: "important",
          },
          {
            id: "5",
            title: "Parent-Teacher Meeting",
            details:
              "The parent-teacher meeting for this term will be held on December 15th, 2023 from 9:00 AM to 3:00 PM. Parents are requested to book their slots in advance through the school portal.",
            date: "2023-10-28",
            isRead: false,
            category: "event",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [toast])

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
    setIsDialogOpen(true)

    // Mark notice as read if it's not already
    if (!notice.isRead) {
      markNoticeAsRead(notice.id)
    }
  }

  const markNoticeAsRead = async (noticeId: string) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      // In a real app, you would call the API to mark the notice as read
      // For now, we'll just update the local state
      setNotices((prevNotices) =>
        prevNotices.map((notice) => (notice.id === noticeId ? { ...notice, isRead: true } : notice)),
      )

      // Simulate API call
      // const response = await fetch(`/api/student/notices/${noticeId}/read`, {
      //   method: "PUT",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // })

      // if (!response.ok) {
      //   throw new Error("Failed to mark notice as read")
      // }
    } catch (error) {
      console.error("Mark notice as read error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notice as read",
      })
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

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "academic":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Academic</Badge>
      case "event":
        return <Badge className="bg-green-500 hover:bg-green-600">Event</Badge>
      case "general":
        return <Badge className="bg-gray-500 hover:bg-gray-600">General</Badge>
      case "important":
        return <Badge className="bg-red-500 hover:bg-red-600">Important</Badge>
      default:
        return <Badge>Other</Badge>
    }
  }

  const unreadNotices = notices.filter((notice) => !notice.isRead)
  const readNotices = notices.filter((notice) => notice.isRead)

  return (
    <DashboardLayout title="Notices & Announcements" requiredRole="Student">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Notices</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadNotices.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {unreadNotices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array(5)
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
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notices found.</p>
              </div>
            ) : (
              notices.map((notice) => (
                <Card
                  key={notice.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notice.isRead ? "border-l-4 border-l-primary" : ""}`}
                  onClick={() => handleNoticeClick(notice)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {getCategoryBadge(notice.category)}
                        {notice.isRead ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(notice.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{notice.details}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread">
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
            ) : unreadNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No unread notices.</p>
              </div>
            ) : (
              unreadNotices.map((notice) => (
                <Card
                  key={notice.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50 border-l-4 border-l-primary"
                  onClick={() => handleNoticeClick(notice)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {getCategoryBadge(notice.category)}
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(notice.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{notice.details}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Notice Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotice?.title}</DialogTitle>
            <DialogDescription className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              {selectedNotice && formatDate(selectedNotice.date)}
              <span className="ml-2">{selectedNotice && getCategoryBadge(selectedNotice.category)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-foreground whitespace-pre-line">{selectedNotice?.details}</p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
