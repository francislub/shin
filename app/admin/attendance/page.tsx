"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserX, Clock, Download } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  id: string
  date: string
  status: string
  remarks?: string
  student: {
    id: string
    name: string
    rollNum: string
  }
  sclass: {
    id: string
    sclassName: string
  }
  teacher: {
    id: string
    name: string
  }
}

interface AttendanceSummary {
  student: {
    id: string
    name: string
    rollNum: string
  }
  sclass: {
    id: string
    sclassName: string
  }
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  percentage: number
}

interface Class {
  id: string
  sclassName: string
  students: Array<{
    id: string
    name: string
    rollNum: string
  }>
}

export default function AdminAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [selectedClass, selectedDate])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchAttendanceSummary()
    }
  }, [selectedClass, dateRange])

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/admin/classes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive",
        })
        return
      }

      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("sclassId", selectedClass)
      if (selectedDate) params.append("date", selectedDate.toISOString())

      const response = await fetch(`/api/admin/attendance?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data)
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceSummary = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("sclassId", selectedClass)
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const response = await fetch(`/api/admin/attendance/summary?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceSummary(data)
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAttendancePercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const attendanceColumns = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.student.name}</div>
          <div className="text-sm text-muted-foreground">Roll: {row.original.student.rollNum}</div>
        </div>
      ),
    },
    {
      accessorKey: "sclass",
      header: "Class",
      cell: ({ row }: any) => row.original.sclass.sclassName,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => format(new Date(row.getValue("date")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge className={getStatusColor(row.getValue("status"))}>{row.getValue("status")}</Badge>
      ),
    },
    {
      accessorKey: "teacher",
      header: "Marked By",
      cell: ({ row }: any) => row.original.teacher.name,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }: any) => row.getValue("remarks") || "-",
    },
  ]

  const summaryColumns = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.student.name}</div>
          <div className="text-sm text-muted-foreground">Roll: {row.original.student.rollNum}</div>
        </div>
      ),
    },
    {
      accessorKey: "sclass",
      header: "Class",
      cell: ({ row }: any) => row.original.sclass.sclassName,
    },
    {
      accessorKey: "totalDays",
      header: "Total Days",
    },
    {
      accessorKey: "presentDays",
      header: "Present",
      cell: ({ row }: any) => <span className="text-green-600 font-medium">{row.getValue("presentDays")}</span>,
    },
    {
      accessorKey: "absentDays",
      header: "Absent",
      cell: ({ row }: any) => <span className="text-red-600 font-medium">{row.getValue("absentDays")}</span>,
    },
    {
      accessorKey: "lateDays",
      header: "Late",
      cell: ({ row }: any) => <span className="text-yellow-600 font-medium">{row.getValue("lateDays")}</span>,
    },
    {
      accessorKey: "percentage",
      header: "Attendance %",
      cell: ({ row }: any) => {
        const percentage = row.getValue("percentage")
        return (
          <span className={`font-medium ${getAttendancePercentageColor(percentage)}`}>{percentage.toFixed(1)}%</span>
        )
      },
    },
  ]

  // Calculate stats
  const totalStudents = attendanceRecords.length
  const presentCount = attendanceRecords.filter((record) => record.status === "Present").length
  const absentCount = attendanceRecords.filter((record) => record.status === "Absent").length
  const lateCount = attendanceRecords.filter((record) => record.status === "Late").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Monitor and manage student attendance</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
          <TabsTrigger value="summary">Attendance Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Filters for Daily Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.sclassName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DatePicker date={selectedDate} onDateChange={setSelectedDate} placeholder="Select date" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Records</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Attendance for ${format(selectedDate, "MMMM dd, yyyy")}`
                  : "Select a date to view attendance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={attendanceColumns}
                data={attendanceRecords}
                searchKey="student"
                searchPlaceholder="Search students..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {/* Filters for Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.sclassName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  placeholder="Select date range"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendance Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                {dateRange.from && dateRange.to
                  ? `Summary from ${format(dateRange.from, "MMM dd, yyyy")} to ${format(dateRange.to, "MMM dd, yyyy")}`
                  : "Select a date range to view summary"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={summaryColumns}
                data={attendanceSummary}
                searchKey="student"
                searchPlaceholder="Search students..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
