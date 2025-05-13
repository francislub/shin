import { compare, hash } from "bcryptjs"
import { sign, verify } from "jsonwebtoken"
import { randomBytes } from "crypto"

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

// Password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: any, expiresIn = "7d"): string {
  return sign(payload, process.env.JWT_SECRET!, { expiresIn })
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}

// Generate verification token
export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex")
}

// Generate reset token
export function generateResetToken(): string {
  return randomBytes(32).toString("hex")
}

export async function verifyJWT(token: string) {
  try {
    const verified = verify(token, process.env.JWT_SECRET!)
    return verified
  } catch (error) {
    return false
  }
}
