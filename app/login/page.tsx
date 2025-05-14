"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { LoginCarousel } from "@/components/login/login-carousel"
import { AdminRegistrationModal } from "@/components/login/admin-registration-modal"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("Admin")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password, role)

      if (success) {
        toast({
          title: "Login successful",
          description: "You have been logged in successfully.",
        })

        // Redirect based on role
        if (role === "Admin") {
          router.push("/admin/dashboard")
        } else if (role === "Teacher") {
          router.push("/teacher/dashboard")
        } else if (role === "Student") {
          router.push("/student/dashboard")
        } else if (role === "Parent") {
          router.push("/parent/dashboard")
        } else if (role === "HeadTeacher") {
          router.push("/head-teacher/dashboard")
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid credentials. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred during login. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="bg-primary rounded-full p-2 mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Shining Stars</h1>
          </div>

          <h2 className="text-3xl font-bold mb-6">Login to your Account</h2>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <Label htmlFor="role">Login As</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded mt-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Admin">Administrator</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
                <option value="HeadTeacher">Head Teacher</option>
              </select>
            </div>

            <div className="mb-4">
              <Label htmlFor="email">{role === "Student" ? "Roll Number" : "Email Address"}</Label>
              <Input
                id="email"
                type="text"
                placeholder={role === "Student" ? "Enter your roll number" : "Enter your email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {role === "Admin" && (
            <div className="mt-6 text-center">
              <p>Don&apos;t have an admin account?</p>
              <Button variant="link" onClick={() => setShowAdminModal(true)} className="mt-1">
                Create Admin Account
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Image carousel */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <LoginCarousel />
      </div>

      {/* Admin Registration Modal */}
      <AdminRegistrationModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </div>
  )
}
