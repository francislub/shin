"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon, Clock, Save, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Class {
  id: string
  name: string
  section: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  photoUrl?: string
  attendance?: {
    id: string
    status: "present" | "absent" | "late"
    date: string
  }
}

interface AttendanceRecord {
  studentId: string
  status: "present" | "absent" | "late"
}

export default function TeacherAttendancePage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [date, setDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingAttendance, setExistingAttendance] = useState(false)

  useEffect(() => {
    if (token) {
      fetchClasses()
    }
  }, [token])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes?teacherId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }

      const data = await response.json()
      setClasses(data)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async (classId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subjects?teacherId=${user?.id}&classId=${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch subjects")
      }

      const data = await response.json()
      setSubjects(data)
      setSelectedSubject("")
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!selectedClass || !selectedSubject) return

    try {
      setLoading(true)
      const response = await fetch(`/api/students?classId=${selectedClass}&subjectId=${selectedSubject}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      setStudents(data)

      // Initialize attendance records for all students as present
      const initialRecords = data.map((student: Student) => ({
        studentId: student.id,
        status: "present" as const,
      }))
      setAttendanceRecords(initialRecords)

      // Check if attendance already exists for this date, class, and subject
      checkExistingAttendance()
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkExistingAttendance = async () => {
    if (!selectedClass || !selectedSubject || !date) return

    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const response = await fetch(
        `/api/attendance?classId=${selectedClass}&subjectId=${selectedSubject}&date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to check existing attendance")
      }

      const data = await response.json()

      if (data.length > 0) {
        setExistingAttendance(true)

        // Map the existing attendance to our format
        const existingRecords = data.map((record: any) => ({
          studentId: record.studentId,
          status: record.status,
        }))

        setAttendanceRecords(existingRecords)

        // Update the students with their attendance status
        setStudents((prevStudents) =>
          prevStudents.map((student) => {
            const attendanceRecord = data.find((record: any) => record.studentId === student.id)
            return {
              ...student,
              attendance: attendanceRecord
                ? {
                    id: attendanceRecord.id,
                    status: attendanceRecord.status,
                    date: attendanceRecord.date,
                  }
                : undefined,
            }
          }),
        )
      } else {
        setExistingAttendance(false)
      }
    } catch (error) {
      console.error("Error checking existing attendance:", error)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass)
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject && date) {
      fetchStudents()
    }
  }, [selectedClass, selectedSubject, date])

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((record) => (record.studentId === studentId ? { ...record, status } : record)),
    )
  }

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !date || attendanceRecords.length === 0) {
      toast({
        title: "Error",
        description: "Please select a class, subject, date and mark attendance for all students.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const formattedDate = format(date, "yyyy-MM-dd")

      const response = await fetch("/api/attendance", {
        method: existingAttendance ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          date: formattedDate,
          teacherId: user?.id,
          attendanceRecords,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save attendance")
      }

      toast({
        title: "Success",
        description: `Attendance ${existingAttendance ? "updated" : "saved"} successfully`,
      })

      // Refresh the attendance data
      checkExistingAttendance()
    } catch (error) {
      console.error("Error saving attendance:", error)
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Mark attendance for students in your classes.</p>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="class">Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger id="class">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            disabled={!selectedClass || subjects.length === 0}
          >
            <SelectTrigger id="subject">
              <SelectValue
                placeholder={
                  !selectedClass
                    ? "Select a class first"
                    : subjects.length === 0
                      ? "No subjects available"
                      : "Select subject"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-1">
                      <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-9 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-9 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !selectedClass || !selectedSubject ? (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Please select a class and subject to view students and mark attendance.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students to display</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a class and subject to view students and mark attendance.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Students Found</CardTitle>
            <CardDescription>There are no students in this class for the selected subject.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no students enrolled in this class for the selected subject.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>
                {format(date, "PPP")} • {classes.find((c) => c.id === selectedClass)?.name} •{" "}
                {subjects.find((s) => s.id === selectedSubject)?.name}
              </CardDescription>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : existingAttendance ? "Update Attendance" : "Save Attendance"}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {student.photoUrl ? (
                          <AvatarImage
                            src={student.photoUrl || "/placeholder.svg"}
                            alt={`${student.firstName} ${student.lastName}`}
                          />
                        ) : null}
                        <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={
                          attendanceRecords.find((r) => r.studentId === student.id)?.status === "present"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleAttendanceChange(student.id, "present")}
                      >
                        <UserCheck className="h-4 w-4" />
                        Present
                      </Button>
                      <Button
                        variant={
                          attendanceRecords.find((r) => r.studentId === student.id)?.status === "absent"
                            ? "destructive"
                            : "outline"
                        }
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleAttendanceChange(student.id, "absent")}
                      >
                        <UserX className="h-4 w-4" />
                        Absent
                      </Button>
                      <Button
                        variant={
                          attendanceRecords.find((r) => r.studentId === student.id)?.status === "late"
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleAttendanceChange(student.id, "late")}
                      >
                        <Clock className="h-4 w-4" />
                        Late
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : existingAttendance ? "Update Attendance" : "Save Attendance"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
