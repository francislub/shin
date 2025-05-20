import nodemailer from "nodemailer"
import "server-only"

type EmailOptions = {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Sends an email using the configured SMTP server
 * This function can only be used in server components or API routes
 */
export async function sendEmail({ to, subject, html, cc, bcc, attachments }: EmailOptions): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      secure: true,
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
    })

    console.log(`Email sent successfully to ${to}`)
  } catch (error) {
    console.error("Failed to send email:", error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generates HTML for verification emails
 */
export function getVerificationEmailHtml(name: string, verificationUrl: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2>Verify your email address</h2>
      <p>Hello ${name},</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
      <p>If you did not create an account, you can ignore this email.</p>
      <p>Thank you,<br>School Management System</p>
    </div>
  `
}

/**
 * Generates HTML for password reset emails
 */
export function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2>Reset your password</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
      <p>If you did not request a password reset, you can ignore this email.</p>
      <p>Thank you,<br>School Management System</p>
    </div>
  `
}

/**
 * Generates HTML for welcome emails
 */
export function getWelcomeEmailHtml(name: string, role: string, loginUrl: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2>Welcome to School Management System</h2>
      <p>Hello ${name},</p>
      <p>Your account has been successfully created as a ${role}.</p>
      <p>You can now log in to access your dashboard and features:</p>
      <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Log In</a>
      <p>If you have any questions, please contact the school administrator.</p>
      <p>Thank you,<br>School Management System</p>
    </div>
  `
}
