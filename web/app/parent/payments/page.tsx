"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Payment {
  id: string
  amount: number
  description: string
  date: string
  dueDate: string
  status: "paid" | "pending" | "failed"
  childName: string
  childId: string
  receiptUrl?: string
}

interface Child {
  id: string
  name: string
}

export default function ParentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          return
        }

        // Fetch children
        const childrenResponse = await fetch("/api/parent/children", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json()
          setChildren(childrenData)
        }

        // Fetch payments
        const paymentsResponse = await fetch("/api/parent/payments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          setPayments(paymentsData)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch payment data",
          })
        }
      } catch (error) {
        console.error("Payments data error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while fetching payment data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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

  const handlePayNow = async (paymentId: string) => {
    toast({
      title: "Payment Processing",
      description: "You will be redirected to the payment gateway.",
    })
    // In a real app, this would redirect to a payment gateway
  }

  const handleDownloadReceipt = async (receiptUrl: string) => {
    // In a real app, this would download the receipt
    toast({
      title: "Download Started",
      description: "Your receipt is being downloaded.",
    })
  }

  const filteredPayments =
    selectedChild === "all" ? payments : payments.filter((payment) => payment.childId === selectedChild)

  const pendingPayments = filteredPayments.filter((payment) => payment.status === "pending")
  const paidPayments = filteredPayments.filter((payment) => payment.status === "paid")

  return (
    <DashboardLayout title="Payments & Fees" requiredRole="Parent">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View and manage your payments</CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Child" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending Payments
            {pendingPayments.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                  <div className="h-40 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ) : pendingPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-muted-foreground">No pending payments.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.childName}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handlePayNow(payment.id)}>
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                  <div className="h-40 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ) : paidPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payment history found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.childName}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          {payment.receiptUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReceipt(payment.receiptUrl!)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
