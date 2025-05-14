"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ParentChildReportCards } from "@/components/parent/child-report-cards"
import { ParentChildAttendance } from "@/components/parent/child-attendance"
import { ParentChildResults } from "@/components/parent/child-results"
import { ParentChildSubjects } from "@/components/parent/child-subjects"

interface ChildDetails {
  id: string
  name: string
  rollNumber: string
  class: string
  section: string
  admissionDate: string
  gender: string
  dateOfBirth: string
  photo?: string
}

export default function ChildDetailsPage() {
  const params = useParams()
  const childId = params.id as string
  const [childDetails, setChildDetails] = useState<ChildDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchChildDetails = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch(`/api/parent/children/${childId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChildDetails(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch child details",
          })
        }
      } catch (error) {
        console.error("Child details error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching child details",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (childId) {
      fetchChildDetails()
    }
  }, [childId, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout title={childDetails?.name || "Child Details"} requiredRole="Parent">
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-40 w-full animate-pulse rounded-lg bg-muted"></div>
          <div className="h-60 w-full animate-pulse rounded-lg bg-muted"></div>
        </div>
      ) : childDetails ? (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={childDetails.photo || "/placeholder.svg"} alt={childDetails.name} />
                  <AvatarFallback>{childDetails.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{childDetails.name}</h2>
                  <p className="text-muted-foreground">
                    Class: {childDetails.class} {childDetails.section} | Roll No: {childDetails.rollNumber}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p>{childDetails.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p>{formatDate(childDetails.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Date</p>
                      <p>{formatDate(childDetails.admissionDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="report-cards" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="results">Exam Results</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="report-cards">
              <Card>
                <CardHeader>
                  <CardTitle>Report Cards</CardTitle>
                  <CardDescription>View and download your child's report cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <ParentChildReportCards childId={childId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance</CardTitle>
                  <CardDescription>View your child's attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <ParentChildAttendance childId={childId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Results</CardTitle>
                  <CardDescription>View your child's exam results</CardDescription>
                </CardHeader>
                <CardContent>
                  <ParentChildResults childId={childId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>View your child's subjects and schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <ParentChildSubjects childId={childId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">
            Child not found or you don't have permission to view this child's details
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}
