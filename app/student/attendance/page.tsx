"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AttendanceRecord {
  id: string
  subject: string
  date: string
  status: "Present" | "Absent"
}

interface SubjectAttendance {
  subject: string
  total: number
  present: number
  percentage: number
}

export default function StudentAttendance() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/student/attendance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAttendanceRecords(data.records)
          setSubjectAttendance(data.summary)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch attendance records",
          })
        }
      } catch (error) {
        console.error("Attendance error:", error)
        // Fallback to sample data if API fails
        const sampleRecords = [
          { id: "1", subject: "Mathematics", date: "2023-11-01", status: "Present" },
          { id: "2", subject: "English", date: "2023-11-01", status: "Present" },
          { id: "3", subject: "Science", date: "2023-11-02", status: "Absent" },
          { id: "4", subject: "History", date: "2023-11-02", status: "Present" },
          { id: "5", subject: "Mathematics", date: "2023-11-03", status: "Present" },
          { id: "6", subject: "English", date: "2023-11-03", status: "Present" },
          { id: "7", subject: "Science", date: "2023-11-04", status: "Present" },
          { id: "8", subject: "History", date: "2023-11-04", status: "Present" },
          { id: "9", subject: "Mathematics", date: "2023-11-05", status: "Absent" },
          { id: "10", subject: "English", date: "2023-11-05", status: "Present" },
        ] as AttendanceRecord[]

        setAttendanceRecords(sampleRecords)

        // Calculate subject attendance summary
        const subjects = [...new Set(sampleRecords.map((record) => record.subject))]
        const summary = subjects.map((subject) => {
          const subjectRecords = sampleRecords.filter((record) => record.subject === subject)
          const total = subjectRecords.length
          const present = subjectRecords.filter((record) => record.status === "Present").length
          const percentage = Math.round((present / total) * 100)

          return {
            subject,
            total,
            present,
            percentage,
          }
        })

        setSubjectAttendance(summary)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendance()
  }, [toast])

  // Filter records for selected date
  const getRecordsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return []

    const dateString = selectedDate.toISOString().split("T")[0]
    return attendanceRecords.filter((record) => record.date === dateString)
  }

  const selectedDateRecords = getRecordsForDate(date)

  return (
    <DashboardLayout title="My Attendance" requiredRole="Student">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
                <CardDescription>Select a date to view attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  disabled={(date) => {
                    // Disable future dates
                    return date > new Date()
                  }}
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  {date
                    ? date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a date"}
                </CardTitle>
                <CardDescription>Attendance records for selected date</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="h-5 w-32 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-20 animate-pulse rounded bg-muted"></div>
                      </div>
                    ))}
                  </div>
                ) : selectedDateRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground">No attendance records found for this date.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="font-medium">{record.subject}</div>
                        <div className="flex items-center">
                          {record.status === "Present" ? (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                              <span className="text-green-500">Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-5 w-5 text-red-500" />
                              <span className="text-red-500">Absent</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Your attendance percentage by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-32 animate-pulse rounded bg-muted"></div>
                        <div className="h-5 w-16 animate-pulse rounded bg-muted"></div>
                      </div>
                      <div className="h-4 w-full animate-pulse rounded bg-muted"></div>
                    </div>
                  ))}
                </div>
              ) : subjectAttendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No attendance data available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {subjectAttendance.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{item.subject}</div>
                        <div className="text-sm">
                          {item.present}/{item.total} classes ({item.percentage}%)
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
