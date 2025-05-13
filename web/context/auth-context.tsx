"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    checkAuth()
  }, [])

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        setUser(null)
        setIsLoading(false)
        return false
      }

      // Verify token with backend
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsLoading(false)
        return true
      } else {
        // Token is invalid or expired
        localStorage.removeItem("token")
        setUser(null)
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("token")
      setUser(null)
      setIsLoading(false)
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

        // Save token to localStorage
        localStorage.setItem("token", data.token)

        // Set user data
        setUser(data.user)

        // Send login notification
        try {
          await fetch("/api/notifications/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
          })
        } catch (notificationError) {
          console.error("Login notification error:", notificationError)
        }

        setIsLoading(false)
        return true
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorData.error || "Invalid credentials",
        })
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred during login",
      })
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      // Remove token from localStorage
      localStorage.removeItem("token")

      // Clear user data
      setUser(null)

      // Redirect to login page
      router.push("/login")

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
