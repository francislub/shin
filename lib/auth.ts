import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { randomBytes } from "crypto"

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
