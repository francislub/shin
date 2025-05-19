"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<boolean>
  resetInactivityTimer: () => void
}

const INACTIVITY_TIMEOUT = 1800000 // 30 minutes in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Use refs for values that shouldn't trigger re-renders
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAuthenticatedRef = useRef(false)

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    if (isAuthenticatedRef.current) {
      inactivityTimerRef.current = setTimeout(() => {
        toast({
          title: "Session expired",
          description: "You have been logged out due to inactivity",
        })
        logoutInternal()
      }, INACTIVITY_TIMEOUT)
    }
  }

  // Internal logout function that doesn't depend on state or props
  const logoutInternal = () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        // Use a fire-and-forget approach for the logout API call
        fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((error) => {
          console.error("Logout API error:", error)
        })
      }
    } finally {
      // Clear authentication state
      localStorage.removeItem("token")
      localStorage.removeItem("userData")
      isAuthenticatedRef.current = false

      // Clear the timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }

      // Update React state last to avoid triggering effects too early
      setUser(null)

      // Navigate to login
      router.push("/login")
    }
  }

  // Public logout function exposed through context
  const logout = () => {
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    logoutInternal()
  }

  // Initial auth check
  useEffect(() => {
    const initialAuthCheck = async () => {
      try {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("userData")

        if (!token) {
          setUser(null)
          setIsLoading(false)
          isAuthenticatedRef.current = false
          return
        }

        // Use cached data immediately if available
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            isAuthenticatedRef.current = true
          } catch (e) {
            console.error("Failed to parse user data:", e)
            localStorage.removeItem("userData")
          }
        }

        // Verify with backend (but don't block UI on this)
        try {
          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            localStorage.setItem("userData", JSON.stringify(userData))
            isAuthenticatedRef.current = true
          } else {
            // Token invalid
            localStorage.removeItem("token")
            localStorage.removeItem("userData")
            setUser(null)
            isAuthenticatedRef.current = false
          }
        } catch (error) {
          console.error("Auth verification error:", error)
          // Don't log out on network errors
        }
      } finally {
        setIsLoading(false)
      }
    }

    initialAuthCheck()
  }, []) // Empty dependency array - this effect runs once

  // Set up activity tracking
  useEffect(() => {
    // Update ref when user state changes
    isAuthenticatedRef.current = !!user

    // Only set up listeners if authenticated
    if (user) {
      const activityEvents = ["mousedown", "keypress", "scroll", "touchstart"]

      const handleUserActivity = () => {
        resetInactivityTimer()
      }

      // Set initial timer
      resetInactivityTimer()

      // Add event listeners
      activityEvents.forEach((event) => {
        window.addEventListener(event, handleUserActivity)
      })

      // Cleanup
      return () => {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current)
        }

        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleUserActivity)
        })
      }
    }
  }, [user]) // Only depends on user

  const checkAuth = async (): Promise<boolean> => {
    if (isLoading) {
      // If still loading, wait for the initial auth check
      return isAuthenticatedRef.current
    }

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return false
      }

      return isAuthenticatedRef.current
    } catch (error) {
      console.error("Check auth error:", error)
      return false
    }
  }

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      if (response.ok) {
        const data = await response.json()

        // Save auth data
        localStorage.setItem("token", data.token)
        localStorage.setItem("userData", JSON.stringify(data.user))

        // Store the schoolId if the user is an admin
        if (data.user.role === "Admin") {
          localStorage.setItem("schoolId", data.user.id)
        } else if (data.schoolId) {
          localStorage.setItem("schoolId", data.schoolId)
        }

        // Update state
        setUser(data.user)
        isAuthenticatedRef.current = true

        // Reset inactivity timer
        resetInactivityTimer()

        // Send login notification (don't block on this)
        fetch("/api/notifications/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
        }).catch((error) => {
          console.error("Login notification error:", error)
        })

        return true
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorData.error || "Invalid credentials",
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred during login",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    resetInactivityTimer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
