import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJWT } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get specific payment
    const payment = await prisma.payment.findUnique({
      where: {
        id: params.id,
        schoolId: decoded.id,
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
        parent: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Format the response
    const formattedPayment = {
      id: payment.id,
      amount: payment.amount,
      description: payment.description,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status,
      studentName: payment.student.name,
      studentId: payment.studentId,
      parentName: payment.parent.name,
      parentId: payment.parentId,
      receiptUrl: payment.receiptUrl,
    }

    return NextResponse.json(formattedPayment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await req.json()

    // Verify the payment belongs to this school
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        schoolId: decoded.id,
      },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found or not associated with this school" }, { status: 404 })
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: {
        id: params.id,
      },
      data: body,
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the payment belongs to this school
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        schoolId: decoded.id,
      },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found or not associated with this school" }, { status: 404 })
    }

    // Delete payment
    await prisma.payment.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
  }
}
