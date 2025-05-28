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
import { Download, Eye, Printer, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { StudentReportCardBotMid } from "@/components/admin/student-report-card-bot-mid"
import { StudentReportCardMidEnd } from "@/components/admin/student-report-card-mid-end"
import { useReactToPrint } from "react-to-print"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

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
  subjects: any[]
  performance: any
  conduct: {
    discipline: string
    timeManagement: string
    smartness: string
    attendanceRemarks: string
    attendancePercentage?: number
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
  const [reportType, setReportType] = useState<"bot-mid" | "mid-end">("bot-mid")
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("individual")

  const reportCardRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const { user } = useAuth()

  const getSelectedClassName = () => {
    const selectedClassObj = classes.find((cls) => cls.id === selectedClass)
    return selectedClassObj ? selectedClassObj.sclassName : ""
  }

  const getSelectedTermName = () => {
    const selectedTermObj = terms.find((term) => term.id === selectedTerm)
    return selectedTermObj ? `${selectedTermObj.termName} ${selectedTermObj.year}` : ""
  }

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

      const response = await fetch(
        `/api/students/${selectedStudent}/report-card?termId=${selectedTerm}&type=${reportType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

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

  // Print report card
  const handlePrintReportCard = useReactToPrint({
    content: () => reportCardRef.current,
    documentTitle: `Report_Card_${reportType}_${reportCardData?.student?.name || "Student"}_${reportCardData?.term?.name || "Term"}_${
      reportCardData?.term?.year || new Date().getFullYear()
    }`,
    onAfterPrint: () => {
      toast({
        title: "Success",
        description: "Report card printed successfully",
      })
    },
  })

  // Download report card as PDF
  const handleDownloadReportCard = async () => {
    if (!reportCardRef.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Report card not available for download",
      })
      return
    }

    try {
      setIsDownloading(true)

      const element = reportCardRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Report_Card_${reportType}_${reportCardData?.student?.name || "Student"}.pdf`)

      toast({
        title: "Success",
        description: "Report card downloaded successfully",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download report card",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <DashboardLayout title="Report Cards" requiredRole="Admin">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="individual">Individual Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Generate Individual Report Card</CardTitle>
              <CardDescription>
                Select a class, term, student, and report type to generate a report card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={(value: "bot-mid" | "mid-end") => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bot-mid">BOT & MID Term</SelectItem>
                      <SelectItem value="mid-end">MID & END Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="mt-6"
                onClick={fetchReportCard}
                disabled={!selectedClass || !selectedTerm || !selectedStudent || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Generate Report Card"
                )}
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
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student.id)
                                setReportType("bot-mid")
                                fetchReportCard()
                              }}
                              disabled={!selectedTerm || isLoading}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              BOT-MID
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student.id)
                                setReportType("mid-end")
                                fetchReportCard()
                              }}
                              disabled={!selectedTerm || isLoading}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              MID-END
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
              <span>Student Report Card ({reportType.toUpperCase()})</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownloadReportCard} disabled={isDownloading}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handlePrintReportCard}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {reportCardData && (
              <div ref={reportCardRef}>
                {reportType === "bot-mid" ? (
                  <StudentReportCardBotMid data={reportCardData} />
                ) : (
                  <StudentReportCardMidEnd data={reportCardData} />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
