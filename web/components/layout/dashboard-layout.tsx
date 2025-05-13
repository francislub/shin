"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { useMobile } from "@/hooks/use-mobile"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  requiredRole?: string | string[]
}

export function DashboardLayout({ children, title, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, checkAuth } = useAuth()
  const router = useRouter()
  const isMobile = useMobile()

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuthenticated = await checkAuth()

      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // Check if user has required role
      if (requiredRole && user) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

        if (!roles.includes(user.role)) {
          // Redirect to appropriate dashboard based on role
          if (user.role === "Admin") {
            router.push("/admin/dashboard")
          } else if (user.role === "Teacher") {
            router.push("/teacher/dashboard")
          } else if (user.role === "Student") {
            router.push("/student/dashboard")
          } else if (user.role === "Parent") {
            router.push("/parent/dashboard")
          } else if (user.role === "HeadTeacher") {
            router.push("/head-teacher/dashboard")
          } else {
            router.push("/login")
          }
        }
      }
    }

    verifyAuth()
  }, [user, isLoading, checkAuth, router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - only show on desktop */}
      {!isMobile && <Sidebar className="hidden lg:flex" />}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
