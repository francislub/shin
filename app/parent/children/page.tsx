"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, GraduationCap, UserCheck, Award, Eye } from "lucide-react"
import Link from "next/link"

interface Child {
  id: string
  name: string
  rollNum: string
  gender: string
  photo?: string
  class: string
  section?: string
  attendance: number
  grade: string
}

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please log in to view your children",
          })
          return
        }

        // Get current user info to get parent ID
        const userResponse = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userResponse.ok) {
          throw new Error("Failed to verify user")
        }

        const userData = await userResponse.json()

        const response = await fetch(`/api/parent/${userData.id}/children`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Fetch additional data for each child (attendance, grades)
        const enrichedChildren = await Promise.all(
          data.map(async (child: any) => {
            try {
              // Fetch attendance data
              const attendanceResponse = await fetch(
                `/api/attendance?studentId=${child.id}&startDate=${new Date(new Date().getFullYear(), 0, 1).toISOString()}&endDate=${new Date().toISOString()}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              )

              let attendance = 0
              if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json()
                const totalDays = attendanceData.length
                const presentDays = attendanceData.filter((record: any) => record.status === "Present").length
                attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
              }

              // Fetch recent exam results to calculate grade
              const resultsResponse = await fetch(`/api/exams/results?studentId=${child.id}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
              })

              let grade = "N/A"
              if (resultsResponse.ok) {
                const results = await resultsResponse.json()
                if (results.length > 0) {
                  const avgPercentage =
                    results.reduce(
                      (sum: number, result: any) => sum + (result.marksObtained / result.totalMarks) * 100,
                      0,
                    ) / results.length

                  if (avgPercentage >= 90) grade = "A+"
                  else if (avgPercentage >= 80) grade = "A"
                  else if (avgPercentage >= 70) grade = "B+"
                  else if (avgPercentage >= 60) grade = "B"
                  else if (avgPercentage >= 50) grade = "C"
                  else if (avgPercentage >= 40) grade = "D"
                  else grade = "F"
                }
              }

              return {
                id: child.id,
                name: child.name,
                rollNum: child.rollNum,
                gender: child.gender || "Not specified",
                photo: child.photo,
                class: child.sclass?.sclassName || "Not assigned",
                section: child.section,
                attendance,
                grade,
              }
            } catch (error) {
              console.error(`Error enriching data for child ${child.id}:`, error)
              return {
                id: child.id,
                name: child.name,
                rollNum: child.rollNum,
                gender: child.gender || "Not specified",
                photo: child.photo,
                class: child.sclass?.sclassName || "Not assigned",
                section: child.section,
                attendance: 0,
                grade: "N/A",
              }
            }
          }),
        )

        setChildren(enrichedChildren)
        setFilteredChildren(enrichedChildren)
      } catch (error) {
        console.error("Fetch children error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load children data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChildren()
  }, [toast])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChildren(children)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = children.filter(
        (child) =>
          child.name.toLowerCase().includes(query) ||
          child.rollNum.toLowerCase().includes(query) ||
          child.class.toLowerCase().includes(query),
      )
      setFilteredChildren(filtered)
    }
  }, [searchQuery, children])

  // Get attendance color
  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return "text-green-600"
    if (attendance >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600"
    if (grade.startsWith("B")) return "text-blue-600"
    if (grade.startsWith("C")) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <DashboardLayout title="My Children" requiredRole="Parent">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Children Overview</CardTitle>
          <CardDescription>View and manage your children's information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number, or class..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            // Loading skeletons
            <div className="space-y-4">
              {Array(2)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="h-32 w-full animate-pulse rounded bg-muted"></div>
                ))}
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No children found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "You don't have any children registered in the system"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChildren.map((child) => (
                <div
                  key={child.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={child.photo || "/placeholder.svg"} />
                      <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{child.name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{child.rollNum}</span>
                        <span>•</span>
                        <span>
                          {child.class} {child.section && `- Section ${child.section}`}
                        </span>
                        <span>•</span>
                        <span>{child.gender}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className={getAttendanceColor(child.attendance)}>{child.attendance}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className={getGradeColor(child.grade)}>{child.grade}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/parent/children/${child.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
