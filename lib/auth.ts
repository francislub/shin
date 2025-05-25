import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"

// Use environment variable for JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || "temporary_fallback_secret_replace_in_production"

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: any): string {
  // Ensure role is preserved exactly as provided
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

// Generate random token for email verification
export function generateVerificationToken(length = 32): string {
  return randomBytes(length).toString("hex")
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<any> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// Generate random token for password reset
export function generateResetToken(length = 32): string {
  return randomBytes(length).toString("hex")
}

// Get session from request headers (for API routes)
export async function getSession(request?: Request): Promise<any> {
  try {
    // If we have a request object, get token from Authorization header
    if (request) {
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null
      }
      const token = authHeader.substring(7)
      return verifyToken(token)
    }

    // Otherwise try to get from cookies (for server components)
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get("auth-token")?.value
      if (!token) {
        return null
      }
      return verifyToken(token)
    } catch (error) {
      // cookies() might not be available in all contexts
      return null
    }
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

// Set session cookie
export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  })
}

// Clear session cookie
export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}
