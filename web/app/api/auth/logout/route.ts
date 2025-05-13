import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Since we're using localStorage for token storage on the client side,
    // we don't need to do anything server-side for logout
    // The client will remove the token from localStorage

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Something went wrong during logout" }, { status: 500 })
  }
}
