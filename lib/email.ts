/**
 * This file is a placeholder to maintain backward compatibility.
 * It re-exports the email templates from email-server.ts but not the sendEmail function.
 *
 * IMPORTANT: Do not import this file in client components.
 * Use the server actions from app/actions/email-actions.ts instead.
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
