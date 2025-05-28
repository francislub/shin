import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Calendar, FileText, User } from "lucide-react"

interface ResultCardProps {
  result: {
    id: string
    marksObtained: number
    totalMarks: number
    examType: string
    date: string
    remarks?: string
    subject?: {
      subName: string
      subCode: string
    }
    student?: {
      name: string
      rollNum: string
    }
    child?: {
      name: string
      rollNum: string
    }
  }
}

export function ResultCard({ result }: ResultCardProps) {
  const percentage = ((result.marksObtained / result.totalMarks) * 100).toFixed(1)

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C"
    if (percentage >= 40) return "D"
    return "F"
  }

  const getBadgeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500"
    if (percentage >= 80) return "bg-green-400"
    if (percentage >= 70) return "bg-blue-500"
    if (percentage >= 60) return "bg-blue-400"
    if (percentage >= 50) return "bg-yellow-500"
    if (percentage >= 40) return "bg-yellow-400"
    return "bg-red-500"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const grade = getGrade(Number.parseFloat(percentage))
  const badgeColor = getBadgeColor(Number.parseFloat(percentage))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{result.subject?.subName || "Exam Result"}</CardTitle>
            <CardDescription>{result.subject?.subCode && `Code: ${result.subject.subCode}`}</CardDescription>
          </div>
          <Badge className={`${badgeColor} text-white`}>{grade}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Student:</span>
            <span className="font-medium ml-1">{result.student?.name || result.child?.name || "N/A"}</span>
          </div>

          <div className="flex items-center text-sm">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Exam Type:</span>
            <span className="font-medium ml-1">{result.examType}</span>
          </div>

          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium ml-1">{formatDate(result.date)}</span>
          </div>

          <div className="flex items-center text-sm">
            <Award className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Score:</span>
            <span className="font-medium ml-1">
              {result.marksObtained} / {result.totalMarks} ({percentage}%)
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        {result.remarks && <p className="text-sm text-muted-foreground italic">"{result.remarks}"</p>}
      </CardFooter>
    </Card>
  )
}
