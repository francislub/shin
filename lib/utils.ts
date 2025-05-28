import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateGrade(marksObtained: number, totalMarks: number): string {
  const percentage = (marksObtained / totalMarks) * 100

  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C+"
  if (percentage >= 40) return "C"
  if (percentage >= 30) return "D"
  return "F"
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-green-600 bg-green-50"
    case "B+":
    case "B":
      return "text-blue-600 bg-blue-50"
    case "C+":
    case "C":
      return "text-yellow-600 bg-yellow-50"
    case "D":
      return "text-orange-600 bg-orange-50"
    case "F":
      return "text-red-600 bg-red-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

export function calculatePercentage(marksObtained: number, totalMarks: number): number {
  return Math.round((marksObtained / totalMarks) * 100)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getAttendanceColor(status: string): string {
  switch (status.toLowerCase()) {
    case "present":
      return "text-green-600 bg-green-50"
    case "absent":
      return "text-red-600 bg-red-50"
    case "late":
      return "text-yellow-600 bg-yellow-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

export function calculateAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 0
  return Math.round((present / total) * 100)
}
