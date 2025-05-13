"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, CheckCircle, XCircle, Clock, Download, Plus } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface Payment {
  id: string
  amount: number
  description: string
  date: string
  dueDate: string
  status: "paid" | "pending" | "failed"
  studentName: string
  studentId: string
  parentName: string
  parentId: string
  receiptUrl?: string
}

interface Student {
  id: string
  name: string
}

const paymentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
})

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: "",
      amount: "",
      description: "",
      dueDate: "",
    },
  })

  useEffect(() => {
    fetchData()
  }, [selectedStatus, selectedStudent])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      // Fetch students
      const studentsResponse = await fetch("/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      }

      // Build query params
      const queryParams = new URLSearchParams()
      if (selectedStatus !== "all") {
        queryParams.append("status", selectedStatus)
      }
      if (selectedStudent !== "all") {
        queryParams.append("studentId", selectedStudent)
      }

      // Fetch payments
      const paymentsResponse = await fetch(`/api/admin/payments?${queryParams.toString()}`, {
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

  const onSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment created successfully",
        })
        setIsDialogOpen(false)
        form.reset()
        fetchData()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create payment",
        })
      }
    } catch (error) {
      console.error("Create payment error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating the payment",
      })
    }
  }

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment status updated successfully",
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update payment status",
        })
      }
    } catch (error) {
      console.error("Update payment error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating the payment status",
      })
    }
  }

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

  const pendingPayments = payments.filter((payment) => payment.status === "pending")
  const paidPayments = payments.filter((payment) => payment.status === "paid")
  const failedPayments = payments.filter((payment) => payment.status === "failed")

  return (
    <DashboardLayout title="Payments Management" requiredRole="Admin">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Payments Management</CardTitle>
                <CardDescription>Create and manage student payments</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Payment</DialogTitle>
                      <DialogDescription>
                        Add a new payment for a student. This will be visible to the parent.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a student" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                      {student.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Tuition Fee for Term 1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit">Create Payment</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending
            {pendingPayments.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid
            {paidPayments.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {paidPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            {failedPayments.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground">
                {failedPayments.length}
              </Badge>
            )}
          </TabsTrigger>
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
                  <p className="text-muted-foreground">No pending payments found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.parentName}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(payment.id, "paid")}>
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() => handleStatusChange(payment.id, "failed")}
                            >
                              Mark Failed
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
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
                  <p className="text-muted-foreground">No paid payments found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Parent</TableHead>
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
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.parentName}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          {payment.receiptUrl ? (
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-4 w-4" />
                              Receipt
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Plus className="mr-2 h-4 w-4" />
                              Add Receipt
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

        <TabsContent value="failed">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                  <div className="h-40 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ) : failedPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-muted-foreground">No failed payments found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{payment.parentName}</TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatAmount(payment.amount)}</TableCell>
                        <TableCell className="text-right">{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(payment.id, "pending")}
                            >
                              Mark Pending
                            </Button>
                          </div>
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
