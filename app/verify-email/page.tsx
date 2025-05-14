"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token")
        // Default to Admin role if not specified
        const role = searchParams.get("role") || "Admin"

        if (!token) {
          setStatus("error")
          setMessage("Invalid verification link. Missing token.")
          return
        }

        console.log("Attempting to verify email with:", { token, role })

        // Make the API call to verify the email
        const response = await fetch(`/api/auth/verify-email?token=${token}&role=${role}`)

        // Try to parse the JSON response, but don't fail if it's not JSON
        let responseData = {}
        try {
          responseData = await response.json()
        } catch (e) {
          console.log("Response is not JSON, likely a redirect")
        }

        console.log("Verification response:", { status: response.status, data: responseData })

        if (response.ok || response.redirected) {
          setStatus("success")
          setMessage("Your email has been verified successfully. You can now log in.")
        } else {
          setStatus("error")
          setMessage(responseData.error || "Failed to verify email. The link may be invalid or expired.")
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setStatus("error")
        setMessage("An error occurred during email verification. Please try again later.")
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleManualVerify = async () => {
    try {
      setStatus("loading")
      const token = searchParams.get("token")
      const role = searchParams.get("role") || "Admin"

      if (!token) {
        setStatus("error")
        setMessage("Missing verification token")
        return
      }

      console.log("Manual verification attempt with:", { token, role })

      const response = await fetch(`/api/auth/verify-email?token=${token}&role=${role}`)

      if (response.ok || response.redirected) {
        setStatus("success")
        setMessage("Your email has been verified successfully. You can now log in.")
      } else {
        const data = await response.json().catch(() => ({}))
        setStatus("error")
        setMessage(data.error || "Failed to verify email. Please try again.")
      }
    } catch (error) {
      console.error("Manual verification error:", error)
      setStatus("error")
      setMessage("An error occurred during verification. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p>Verifying your email address...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center">{message}</p>
                <Button onClick={() => router.push("/login")}>Go to Login</Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-16 w-16 text-red-500" />
                <p className="text-center">{message}</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={handleManualVerify}>Try Again</Button>
                  <Button variant="outline" onClick={() => router.push("/login")}>
                    Go to Login
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
