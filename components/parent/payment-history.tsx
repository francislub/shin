"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

interface Payment {
  id: string
  amount: number
  description: string
  date: string
  status: "paid" | "pending" | "failed"
  childName?: string
}

export function ParentPaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        const response = await fetch("/api/parent/payments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPayments(data)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch payment history",
          })
        }
      } catch (error) {
        console.error("Payment history error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching payment history",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 flex items-center">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge>Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 rounded-md border p-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted"></div>
            </div>
            <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No payment history found</p>
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-start space-x-4 rounded-md border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{payment.description}</p>
              <p className="font-medium">{formatAmount(payment.amount)}</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatDate(payment.date)}</span>
                {payment.childName && <span className="ml-2">• {payment.childName}</span>}
              </div>
              {getStatusBadge(payment.status)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
