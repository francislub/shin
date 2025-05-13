"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, KeyRound } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const token = searchParams.get("token")
  const role = searchParams.get("role")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !role) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid reset link. Missing token or role.",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      })
      return
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          role,
          password,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your password has been reset successfully. You can now log in with your new password.",
        })
        router.push("/login")
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to reset password. The link may be invalid or expired.",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during password reset. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">Enter a new password for your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
