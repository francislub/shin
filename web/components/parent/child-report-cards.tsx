"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReactToPrint } from "react-to-print"
import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Printer } from "lucide-react"
import { StudentReportCard } from "@/components/admin/student-report-card"

interface Term {
  id: string
  termName: string
  year: string
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

export function ParentChildReportCards({ childId }: { childId: string }) {
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()
  const reportCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/terms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTerms(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch terms",
          })
        }
      } catch (error) {
        console.error("Fetch terms error:", error)
        // Fallback to sample data if API fails
        setTerms([
          {
            id: "1",
            termName: "Term 1",
            year: "2023",
          },
          {
            id: "2",
            termName: "Term 2",
            year: "2023",
          },
          {
            id: "3",
            termName: "Term 3",
            year: "2023",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTerms()
  }, [toast])

  const fetchReportCard = async () => {
    if (!selectedTerm) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a term",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`/api/students/${childId}/report-card?termId=${selectedTerm}`, {
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
        description: "An error occurred while fetching the report card",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintReportCard = useReactToPrint({
    content: () => reportCardRef.current,
    documentTitle: `Report_Card_${reportCardData?.student.name}_${reportCardData?.term.name}_${reportCardData?.term.year}`,
  })

  const handleDownloadReportCard = () => {
    // In a real implementation, you would generate a PDF and download it
    // For now, we'll just use the print functionality
    handlePrintReportCard()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-sm font-medium">Select Term</label>
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
        <Button onClick={fetchReportCard} disabled={!selectedTerm || isLoading}>
          {isLoading ? "Loading..." : "View Report Card"}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Available Report Cards</h3>
        {terms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No report cards available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map((term) => (
              <div key={term.id} className="border rounded-lg p-4">
                <h4 className="font-medium">
                  {term.termName} {term.year}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">End of term assessment</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTerm(term.id)
                      fetchReportCard()
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Card</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mb-4">
            <Button variant="outline" onClick={handleDownloadReportCard}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handlePrintReportCard}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
          <div ref={reportCardRef} className="p-4 bg-white">
            {reportCardData && <StudentReportCard data={reportCardData} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
