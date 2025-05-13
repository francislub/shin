"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface AdminRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminRegistrationModal({ isOpen, onClose }: AdminRegistrationModalProps) {
  const [step, setStep] = useState(1)
  const [accessCode, setAccessCode] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Check if access code is correct (12345)
    if (accessCode === "12345") {
      setStep(2)
      toast({
        title: "Access code verified",
        description: "Please enter your email to continue registration.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Invalid access code",
        description: "The access code you entered is incorrect. Please try again.",
      })
    }

    setIsLoading(false)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call API to send registration email
      const response = await fetch("/api/auth/admin-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        toast({
          title: "Registration email sent",
          description: "Please check your email to complete the registration process.",
        })
        onClose()
        setStep(1)
        setAccessCode("")
        setEmail("")
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.error || "Failed to send registration email. Please try again.",
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

  const handleClose = () => {
    onClose()
    setStep(1)
    setAccessCode("")
    setEmail("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 1 ? "Enter Access Code" : "Admin Registration"}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Please enter the access code to create an admin account."
              : "Enter your email to receive a registration link."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleClose} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="mr-2">
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Registration Link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
