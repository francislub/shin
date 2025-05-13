"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Eye, Printer } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { StudentReportCard } from "@/components/admin/student-report-card"
import { useReactToPrint } from "react-to-print"

interface Class {
  id: string
  sclassName: string
}

interface Term {
  id: string
  termName: string
  year: string
  status: string
}

interface Student {
  id: string
  name: string
  rollNum: string
  photo?: string
  sclass: {
    id: string
    sclassName: string
  }
}

interface ReportCardData {
  student: {
    id: string
    name: string
    rollNum: string
    gender: string
    photo?: string
    class: string
    year: string
  }
  school: {
    name: string
    id: string
  }
  term: {
    id: string
    name: string
    year: string
    nextTermStarts: string
    nextTermEnds: string
  }
  subjects: {
    id: string
    name: string
    fullMarks: number
    midTerm: {
      marks: number
      grade: string
    }
    endTerm: {
      marks: number
      grade: string
    }
    teacherComment: string
    teacherInitials: string
  }[]
  performance: {
    midTerm: {
      total: number
      average: number
      grade: string
    }
    endTerm: {
      total: number
      average: number
      grade: string
    }
  }
  conduct: {
    discipline: string
    timeManagement: string
    smartness: string
    attendanceRemarks: string
  }
  comments: {
    classTeacher: string
    headTeacher: string
  }
  gradingScale: {
    id: string
    from: number
    to: number
    grade: string
    comment: string
  }[]
}

export default function AdminReportCards() {
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null)
  const [classReportCards, setClassReportCards] = useState<ReportCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("individual")

  const reportCardRef = useRef<HTMLDivElement>(null)
  const allReportCardsRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        // Fetch classes
        const classesResponse = await fetch(`/api/classes?schoolId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData)
        }

        // Fetch terms
        const termsResponse = await fetch(`/api/terms?schoolId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (termsResponse.ok) {
          const termsData = await termsResponse.json()
          setTerms(termsData)
        }
      } catch (error) {
        console.error("Fetch data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, user])

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return

      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        setIsLoading(true)

        const response = await fetch(`/api/students?schoolId=${user?.id}&sclassId=${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStudents(data)

          // Reset selected student
          setSelectedStudent("")
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch students",
          })
        }
      } catch (error) {
        console.error("Fetch students error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching students",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [selectedClass, toast, user])

  const fetchReportCard = async () => {
    if (!selectedStudent || !selectedTerm) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student and term",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      setIsLoading(true)

      const response = await fetch(`/api/students/${selectedStudent}/report-card?termId=${selectedTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReportCardData(data)
        setIsViewDialogOpen(true)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch report card",
        })
      }
    } catch (error) {
      console.error("Fetch report card error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching report card",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassReportCards = async () => {
    if (!selectedClass || !selectedTerm) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class and term",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      setIsLoading(true)

      const response = await fetch(`/api/classes/${selectedClass}/report-cards?termId=${selectedTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClassReportCards(data.reportCards)
        setIsPrintDialogOpen(true)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch class report cards",
        })
      }
    } catch (error) {
      console.error("Fetch class report cards error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while fetching class report cards",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintReportCard = useReactToPrint({
    content: () => reportCardRef.current,
    documentTitle: `Report_Card_${reportCardData?.student.name}_${reportCardData?.term.name}_${reportCardData?.term.year}`,
  })

  const handlePrintAllReportCards = useReactToPrint({
    content: () => allReportCardsRef.current,
    documentTitle: `Class_Report_Cards_${selectedClass}_${selectedTerm}`,
  })

  const handleDownloadReportCard = () => {
    // In a real implementation, you would generate a PDF and download it
    // For now, we'll just use the print functionality
    handlePrintReportCard()
  }

  const handleDownloadAllReportCards = () => {
    // In a real implementation, you would generate a PDF and download it
    // For now, we'll just use the print functionality
    handlePrintAllReportCards()
  }

  const getSelectedClassName = () => {
    const selectedClassObj = classes.find((cls) => cls.id === selectedClass)
    return selectedClassObj ? selectedClassObj.sclassName : ""
  }

  const getSelectedTermName = () => {
    const selectedTermObj = terms.find((term) => term.id === selectedTerm)
    return selectedTermObj ? `${selectedTermObj.termName} ${selectedTermObj.year}` : ""
  }

  return (
    <DashboardLayout title="Report Cards" requiredRole="Admin">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="individual">Individual Report Cards</TabsTrigger>
          <TabsTrigger value="class">Class Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Generate Individual Report Card</CardTitle>
              <CardDescription>Select a class, term, and student to generate a report card.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.sclassName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.termName} {term.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Student</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedClass ? "Select student" : "Select class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.rollNum})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="mt-6"
                onClick={fetchReportCard}
                disabled={!selectedClass || !selectedTerm || !selectedStudent || isLoading}
              >
                {isLoading ? "Loading..." : "Generate Report Card"}
              </Button>
            </CardContent>
          </Card>

          {students.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Students in {getSelectedClassName()}</CardTitle>
                <CardDescription>Select a student from the list to generate their report card.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.rollNum}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student.id)
                                fetchReportCard()
                              }}
                              disabled={!selectedTerm || isLoading}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Report Card
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="class">
          <Card>
            <CardHeader>
              <CardTitle>Generate Class Report Cards</CardTitle>
              <CardDescription>
                Select a class and term to generate report cards for all students in the class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.sclassName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.termName} {term.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="mt-6"
                onClick={fetchClassReportCards}
                disabled={!selectedClass || !selectedTerm || isLoading}
              >
                {isLoading ? "Loading..." : "Generate Class Report Cards"}
              </Button>
            </CardContent>
          </Card>

          {students.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {getSelectedClassName()} - {getSelectedTermName()}
                    </CardTitle>
                    <CardDescription>{students.length} students in this class</CardDescription>
                  </div>
                  <Button
                    className="mt-4 md:mt-0"
                    onClick={fetchClassReportCards}
                    disabled={!selectedTerm || isLoading}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print All Report Cards
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.rollNum}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student.id)
                                fetchReportCard()
                              }}
                              disabled={!selectedTerm || isLoading}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Report Card
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* View Report Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Student Report Card</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownloadReportCard}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button size="sm" onClick={handlePrintReportCard}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {reportCardData && (
              <div ref={reportCardRef}>
                <StudentReportCard data={reportCardData} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Print All Report Cards Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Class Report Cards</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownloadAllReportCards}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
                <Button size="sm" onClick={handlePrintAllReportCards}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print All
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <div ref={allReportCardsRef}>
              {classReportCards.map((reportCard, index) => (
                <div key={reportCard.student.id} className={index > 0 ? "mt-8 pt-8 border-t" : ""}>
                  <StudentReportCard data={reportCard} />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
