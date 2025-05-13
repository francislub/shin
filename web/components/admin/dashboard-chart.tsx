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

export function AdminDashboardChart() {
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

        const response = await fetch("/api/admin/enrollment-chart", {
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
            description: "Failed to fetch enrollment chart data",
          })
        }
      } catch (error) {
        console.error("Chart data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching enrollment chart data",
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
        <p className="text-muted-foreground">No enrollment data available</p>
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
          <Line type="monotone" dataKey="students" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
          <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
