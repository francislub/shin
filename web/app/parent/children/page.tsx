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
          setFilteredChildren(data)
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
            rollNum: "STU2023001",
            gender: "Male",
            class: "Grade 5",
            section: "A",
            attendance: 98,
            grade: "A",
          },
          {
            id: "2",
            name: "Jane Doe",
            rollNum: "STU2023002",
            gender: "Female",
            class: "Grade 3",
            section: "B",
            attendance: 92,
            grade: "B+",
          },
        ]

        setChildren(sampleChildren)
        setFilteredChildren(sampleChildren)
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
