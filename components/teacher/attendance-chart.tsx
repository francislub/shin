"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

interface ChartData {
  name: string
  present: number
  absent: number
}

export function TeacherAttendanceChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const { toast } = useToast()

  const isDark = theme === "dark"

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/teacher/attendance-chart", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const chartData = await response.json()
          setData(chartData)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch attendance chart data",
          })
        }
      } catch (error) {
        console.error("Chart data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching attendance chart data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-muted-foreground">No attendance data available</p>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
          <Bar dataKey="present" fill="#10b981" name="Present" />
          <Bar dataKey="absent" fill="#ef4444" name="Absent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
