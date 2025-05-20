"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
// import { Header } from "@/components/layout/header"
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
  const pathname = usePathname()
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Reset sidebar state when pathname changes (for mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      try {
        if (isMounted) {
          // Only check auth if we haven't already
          if (!authChecked) {
            console.log("Checking authentication...")
            const isAuthenticated = await checkAuth()

            if (isMounted) {
              if (!isAuthenticated) {
                console.log("Not authenticated, redirecting to login")
                router.push("/login")
                return
              }

              console.log("Authentication verified")
              setAuthChecked(true)
            }
          }

          // Only check required roles if we have a user and required role
          if (requiredRole && user) {
            const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

            if (!roles.includes(user.role)) {
              console.log(`User role ${user.role} does not match required roles`, roles)
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
      } catch (error) {
        console.error("Auth verification error:", error)
        if (isMounted) {
          router.push("/login")
        }
      }
    }

    if (!isLoading) {
      verifyAuth()
    }

    return () => {
      isMounted = false
    }
  }, [user, isLoading, authChecked, checkAuth, router, requiredRole])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  // Ensure sidebar is visible on desktop regardless of state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        // Force sidebar to be visible on desktop
        const sidebarElement = document.querySelector(".sidebar-container") as HTMLElement
        if (sidebarElement) {
          sidebarElement.style.transform = "translateX(0)"
        }
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - fixed position */}
      <Sidebar
        className={`sidebar-container fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      {/* <div className="flex flex-1 flex-col w-full"> */}
        <main className="flex-1 p-4 w-full overflow-auto">
          <div className="mx-auto">{children}</div>
        </main>
      {/* </div> */}
    </div>
  )
}
