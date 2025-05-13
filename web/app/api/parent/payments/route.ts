import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyJWT } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parent's payments
    const payments = await prisma.payment.findMany({
      where: {
        parentId: decoded.id,
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Format the response
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      description: payment.description,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status,
      childName: payment.student.name,
      childId: payment.studentId,
      receiptUrl: payment.receiptUrl,
    }))

    return NextResponse.json(formattedPayments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyJWT(token)

    if (!decoded || decoded.role !== "Parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await req.json()
    const { amount, description, studentId, dueDate } = body

    // Validate required fields
    if (!amount || !description || !studentId || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the student belongs to this parent
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: decoded.id,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found or not associated with this parent" }, { status: 404 })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        amount: Number.parseFloat(amount),
        description,
        dueDate: new Date(dueDate),
        status: "pending",
        student: {
          connect: { id: studentId },
        },
        parent: {
          connect: { id: decoded.id },
        },
        school: {
          connect: { id: student.schoolId },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
