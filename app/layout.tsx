import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./clientLayout"

const inter = Inter({ subsets: ["latin"] })

// Metadata needs to be exported from a Server Component
export const metadata: Metadata = {
  title: "SchoolPro - School Management System",
  description: "A comprehensive school management system for administrators, teachers, and students",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
