"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface Child {
  id: string
  name: string
  photo?: string
  class: string
  section?: string
}

interface AttendanceSummary {
  childId: string
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

interface MonthlyAttendance {
  month: string
  present: number
  absent: number
  late: number
  excused: number
}

export default function ParentAttendancePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/parent/children", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChildren(data)
          if (data.length > 0) {
            setSelectedChild(data[0].id)
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch children data",
          })
        }
      } catch (error) {
        console.error("Fetch children error:", error)
        // Fallback to sample data if API fails
        const sampleChildren = [
          {
            id: "1",
            name: "John Doe Jr.",
            class: "Grade 5",
            section: "A",
          },
          {
            id: "2",
            name: "Jane Doe",
            class: "Grade 3",
            section: "B",
          },
        ]

        setChildren(sampleChildren)
        if (sampleChildren.length > 0) {
          setSelectedChild(sampleChildren[0].id)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchChildren()
  }, [toast])

  useEffect(() => {
    if (!selectedChild) return

    const fetchAttendanceSummary = async () => {
      setIsLoading(true)

      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch(`/api/parent/attendance-summary?month=${selectedMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAttendanceSummary(data.summary)
          setMonthlyData(data.monthlyData)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch attendance summary",
          })
        }
      } catch (error) {
        console.error("Fetch attendance summary error:", error)
        // Fallback to sample data if API fails
        const sampleSummary = children.map((child) => ({
          childId: child.id,
          present: Math.floor(Math.random() * 5) + 15, // 15-19 days present
          absent: Math.floor(Math.random() * 3), // 0-2 days absent
          late: Math.floor(Math.random() * 3), // 0-2 days late
          excused: Math.floor(Math.random() * 2), // 0-1 days excused
          percentage: Math.floor(Math.random() * 10) + 90, // 90-99% attendance
        }))

        setAttendanceSummary(sampleSummary)

        // Generate sample monthly data
        const sampleMonthlyData = [
          {
            month: "January",
            present: 18,
            absent: 1,
            late: 1,
            excused: 0,
          },
          {
            month: "February",
            present: 19,
            absent: 0,
            late: 1,
            excused: 0,
          },
          {
            month: "March",
            present: 20,
            absent: 0,
            late: 0,
            excused: 1,
          },
          {
            month: "April",
            present: 17,
            absent: 2,
            late: 1,
            excused: 0,
          },
          {
            month: "May",
            present: 19,
            absent: 1,
            late: 0,
            excused: 0,
          },
          {
            month: "June",
            present: 18,
            absent: 0,
            late: 2,
            excused: 0,
          },
        ]

        setMonthlyData(sampleMonthlyData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendanceSummary()
  }, [selectedChild, selectedMonth, children, toast])

  // Get attendance color based on percentage
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500"
    if (percentage >= 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Generate months for select
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(i)
    return {
      value: `${date.getFullYear()}-${String(i + 1).padStart(2, "0")}`,
      label: date.toLocaleString("default", { month: "long", year: "numeric" }),
    }
  })

  // Get selected child's attendance summary
  const selectedChildSummary = attendanceSummary.find((summary) => summary.childId === selectedChild)

  return (
    <DashboardLayout title="Attendance" requiredRole="Parent">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Monitor your children's attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm font-medium">Select Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} - {child.class} {child.section && `(${child.section})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-32 w-full animate-pulse rounded bg-muted"></div>
              <div className="h-80 w-full animate-pulse rounded bg-muted"></div>
            </div>
          ) : !selectedChild ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No child selected</h3>
              <p className="text-sm text-muted-foreground">Please select a child to view attendance records</p>
            </div>
          ) : (
            <>
              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={children.find((c) => c.id === selectedChild)?.photo || "/placeholder.svg"} />
                        <AvatarFallback>
                          {children.find((c) => c.id === selectedChild)?.name.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{children.find((c) => c.id === selectedChild)?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {children.find((c) => c.id === selectedChild)?.class}{" "}
                          {children.find((c) => c.id === selectedChild)?.section &&
                            `- Section ${children.find((c) => c.id === selectedChild)?.section}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Attendance Rate</span>
                        <span>{selectedChildSummary?.percentage || 0}%</span>
                      </div>
                      <Progress
                        value={selectedChildSummary?.percentage || 0}
                        className={getAttendanceColor(selectedChildSummary?.percentage || 0)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Present</p>
                      <p className="text-2xl font-bold text-green-600">{selectedChildSummary?.present || 0}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{selectedChildSummary?.absent || 0}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Late</p>
                      <p className="text-2xl font-bold text-yellow-600">{selectedChildSummary?.late || 0}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Excused</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedChildSummary?.excused || 0}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Attendance Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Monthly Attendance Trend</h3>
                  <div className="h-80">
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend content={<ChartLegend />} />
                          <Bar dataKey="present" name="Present" fill="#22c55e" />
                          <Bar dataKey="absent" name="Absent" fill="#ef4444" />
                          <Bar dataKey="late" name="Late" fill="#eab308" />
                          <Bar dataKey="excused" name="Excused" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
