"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

interface ChartData {
  name: string
  value: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export function StudentGradeChart() {
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

        const response = await fetch("/api/student/grade-chart", {
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
            description: "Failed to fetch grade chart data",
          })
        }
      } catch (error) {
        console.error("Chart data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching grade chart data",
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
        <p className="text-muted-foreground">No grade data available</p>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderColor: isDark ? "#374151" : "#e5e7eb",
              color: isDark ? "#f9fafb" : "#111827",
            }}
            formatter={(value) => [`${value} subjects`, "Count"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
