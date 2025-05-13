"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, EyeOff, Upload } from "lucide-react"

interface StudentProfile {
  id: string
  name: string
  rollNum: string
  gender?: string
  photo?: string
  sclass: {
    id: string
    sclassName: string
  }
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch(`/api/students/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch profile information",
          })
        }
      } catch (error) {
        console.error("Profile error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching profile information",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchProfile()
    }
  }, [toast, user])

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all password fields",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully.",
        })

        // Reset password fields
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        throw new Error("Failed to change password")
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("photo", file)

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch("/api/upload/student-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile((prev) => (prev ? { ...prev, photo: data.photoUrl } : null))
        toast({
          title: "Photo uploaded",
          description: "Your profile photo has been updated successfully.",
        })
      } else {
        throw new Error("Failed to upload photo")
      }
    } catch (error) {
      console.error("Photo upload error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile photo",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="My Profile" requiredRole="Student">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>View your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="h-24 w-24 animate-pulse rounded-full bg-muted"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
                        <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile?.photo || ""} alt={profile?.name || "Profile"} />
                        <AvatarFallback className="text-2xl">{profile?.name?.charAt(0) || "S"}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2">
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <div className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90">
                            <Upload className="h-4 w-4" />
                          </div>
                          <span className="sr-only">Upload photo</span>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-xl font-semibold">{profile?.name}</h3>
                      <p className="text-muted-foreground">Roll Number: {profile?.rollNum}</p>
                      <p className="text-muted-foreground">Class: {profile?.sclass?.sclassName}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" value={profile?.name || ""} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNum">Roll Number</Label>
                      <Input id="rollNum" name="rollNum" value={profile?.rollNum || ""} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Input id="gender" name="gender" value={profile?.gender || "Not specified"} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Input id="class" name="class" value={profile?.sclass?.sclassName || ""} disabled />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
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
                        />
                      </div>
                    </div>

                    <Button onClick={handleChangePassword} disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
