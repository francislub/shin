"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

interface ChartData {
  name: string
  students: number
  teachers: number
}

// Mock data to use when API fails
const MOCK_CHART_DATA: ChartData[] = [
  { name: "Jan", students: 150, teachers: 12 },
  { name: "Feb", students: 165, teachers: 14 },
  { name: "Mar", students: 180, teachers: 14 },
  { name: "Apr", students: 190, teachers: 15 },
  { name: "May", students: 210, teachers: 18 },
  { name: "Jun", students: 220, teachers: 18 },
  { name: "Jul", students: 205, teachers: 16 },
  { name: "Aug", students: 230, teachers: 19 },
  { name: "Sep", students: 245, teachers: 21 },
  { name: "Oct", students: 260, teachers: 22 },
  { name: "Nov", students: 270, teachers: 23 },
  { name: "Dec", students: 290, teachers: 25 },
]

export function AdminDashboardChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const { toast } = useToast()

  const isDark = theme === "dark"

  useEffect(() => {
    let isMounted = true

    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          if (isMounted) {
            setIsLoading(false)
            toast({
              title: "Authentication error",
              description: "Please log in again to continue",
              variant: "destructive",
            })
          }
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

        try {
          const response = await fetch("/api/admin/enrollment-chart", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const chartData = await response.json()
            if (isMounted) {
              setData(chartData)
            }
          } else {
            const errorData = await response.json()
            console.error("Error fetching chart data:", response.status, errorData)
            if (isMounted) {
              toast({
                title: "Failed to load chart data",
                description: errorData.error || "Please try again later",
                variant: "destructive",
              })
            }
          }
        } catch (fetchError) {
          if (fetchError.name === "AbortError") {
            console.error("Chart data fetch timed out")
            if (isMounted) {
              toast({
                title: "Request timed out",
                description: "The server took too long to respond. Please try again later.",
                variant: "destructive",
              })
            }
          } else {
            console.error("Chart data fetch error:", fetchError)
            if (isMounted) {
              toast({
                title: "Connection error",
                description: "Could not connect to the server. Please check your internet connection.",
                variant: "destructive",
              })
            }
          }
        }
      } catch (error) {
        console.error("Chart data error:", error)
        if (isMounted) {
          toast({
            title: "Error loading chart",
            description: "An unexpected error occurred. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchChartData()

    return () => {
      isMounted = false
    }
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis dataKey="name" stroke={isDark ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e5e7eb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="students"
            stroke="#8b5cf6"
            activeDot={{ r: 8 }}
            strokeWidth={2}
            name="Students"
          />
          <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={2} name="Teachers" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
