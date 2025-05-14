"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminRegistrationProps {
  params: {
    token: string
  }
}

export default function AdminRegistration({ params }: AdminRegistrationProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isTokenChecking, setIsTokenChecking] = useState(true)

  const { toast } = useToast()
  const router = useRouter()
  const { token } = params

  useEffect(() => {
    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-registration-token?token=${token}`)

        if (response.ok) {
          const data = await response.json()
          setEmail(data.email)
          setIsTokenValid(true)
        } else {
          setIsTokenValid(false)
        }
      } catch (error) {
        setIsTokenValid(false)
      } finally {
        setIsTokenChecking(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          schoolName,
          role: "Admin",
          token,
        }),
      })

      if (response.ok) {
        toast({
          title: "Registration successful",
          description: "Your admin account has been created. You can now log in.",
        })
        router.push("/login?registered=true")
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || "Failed to register. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An error occurred. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isTokenChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Verifying registration link...</p>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid or Expired Link</CardTitle>
            <CardDescription>The registration link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please request a new registration link from the login page.</p>
          </CardContent>
          <CardFooter>
            <Link href="/login">
              <Button>Return to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Admin Registration</CardTitle>
          <CardDescription>Create your admin account to manage your school.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled className="mt-1 bg-muted" />
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter your school name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
