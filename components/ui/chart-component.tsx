"use client"
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement)

interface ChartProps {
  type: "bar" | "line" | "pie" | "doughnut"
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
      fill?: boolean
    }[]
  }
  options?: any
  height?: number
  width?: number
}

export function Chart({ type, data, options, height, width }: ChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  const chartOptions = { ...defaultOptions, ...options }

  return (
    <div style={{ height: height || "100%", width: width || "100%" }}>
      {type === "bar" && <Bar data={data} options={chartOptions} />}
      {type === "line" && <Line data={data} options={chartOptions} />}
      {type === "pie" && <Pie data={data} options={chartOptions} />}
      {type === "doughnut" && <Doughnut data={data} options={chartOptions} />}
    </div>
  )
}
