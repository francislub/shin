"use server"

import { sendEmail, getVerificationEmailHtml, getPasswordResetEmailHtml, getWelcomeEmailHtml } from "@/lib/email-server"

type EmailResult = {
  success: boolean
  error?: string
}

/**
 * Sends a verification email to a new user
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  role: string,
  verificationUrl: string,
): Promise<EmailResult> {
  try {
    await sendEmail({
      to,
      subject: "Verify your email address",
      html: getVerificationEmailHtml(name, verificationUrl),
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return { success: false, error: "Failed to send verification email" }
  }
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<EmailResult> {
  try {
    await sendEmail({
      to,
      subject: "Reset your password",
      html: getPasswordResetEmailHtml(name, resetUrl),
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return { success: false, error: "Failed to send password reset email" }
  }
}

/**
 * Sends a welcome email to a newly verified user
 */
export async function sendWelcomeEmail(to: string, name: string, role: string, loginUrl: string): Promise<EmailResult> {
  try {
    await sendEmail({
      to,
      subject: "Welcome to School Management System",
      html: getWelcomeEmailHtml(name, role, loginUrl),
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send welcome email:", error)
    return { success: false, error: "Failed to send welcome email" }
  }
}

/**
 * Sends a notification about a new notice
 */
export async function sendNoticeNotification(
  to: string,
  name: string,
  noticeTitle: string,
  noticeUrl: string,
): Promise<EmailResult> {
  try {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>New Notice: ${noticeTitle}</h2>
        <p>Hello ${name},</p>
        <p>A new notice has been published in your school.</p>
        <p>Click the button below to view the notice:</p>
        <a href="${noticeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Notice</a>
        <p>Thank you,<br>School Management System</p>
      </div>
    `

    await sendEmail({
      to,
      subject: `New Notice: ${noticeTitle}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send notice notification:", error)
    return { success: false, error: "Failed to send notice notification" }
  }
}

/**
 * Sends a notification about exam results
 */
export async function sendExamResultsNotification(
  to: string,
  name: string,
  studentName: string,
  examName: string,
  resultsUrl: string,
): Promise<EmailResult> {
  try {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Exam Results Available</h2>
        <p>Hello ${name},</p>
        <p>The results for ${examName} are now available for ${studentName}.</p>
        <p>Click the button below to view the results:</p>
        <a href="${resultsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Results</a>
        <p>Thank you,<br>School Management System</p>
      </div>
    `

    await sendEmail({
      to,
      subject: `Exam Results Available: ${examName}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send exam results notification:", error)
    return { success: false, error: "Failed to send exam results notification" }
  }
}

/**
 * Sends a payment reminder
 */
export async function sendPaymentReminder(
  to: string,
  name: string,
  studentName: string,
  amount: number,
  dueDate: string,
  paymentUrl: string,
): Promise<EmailResult> {
  try {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Payment Reminder</h2>
        <p>Hello ${name},</p>
        <p>This is a reminder that a payment of $${amount.toFixed(2)} for ${studentName} is due on ${dueDate}.</p>
        <p>Click the button below to make the payment:</p>
        <a href="${paymentUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Make Payment</a>
        <p>Thank you,<br>School Management System</p>
      </div>
    `

    await sendEmail({
      to,
      subject: `Payment Reminder: $${amount.toFixed(2)} due on ${dueDate}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send payment reminder:", error)
    return { success: false, error: "Failed to send payment reminder" }
  }
}

/**
 * Sends a notification about attendance
 */
export async function sendAttendanceNotification(
  to: string,
  name: string,
  studentName: string,
  date: string,
  status: string,
  attendanceUrl: string,
): Promise<EmailResult> {
  try {
    const statusColor = status === "Present" ? "#4CAF50" : status === "Late" ? "#FFC107" : "#F44336"

    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Attendance Notification</h2>
        <p>Hello ${name},</p>
        <p>${studentName} was marked as <span style="color: ${statusColor}; font-weight: bold;">${status}</span> on ${date}.</p>
        <p>Click the button below to view the attendance record:</p>
        <a href="${attendanceUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Attendance</a>
        <p>Thank you,<br>School Management System</p>
      </div>
    `

    await sendEmail({
      to,
      subject: `Attendance Notification: ${studentName} - ${status}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send attendance notification:", error)
    return { success: false, error: "Failed to send attendance notification" }
  }
}

/**
 * Sends a notification about a new message
 */
export async function sendMessageNotification(
  to: string,
  name: string,
  senderName: string,
  messagePreview: string,
  messageUrl: string,
): Promise<EmailResult> {
  try {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>New Message</h2>
        <p>Hello ${name},</p>
        <p>You have received a new message from ${senderName}:</p>
        <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${messagePreview}..."</p>
        </div>
        <p>Click the button below to view the full message:</p>
        <a href="${messageUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Message</a>
        <p>Thank you,<br>School Management System</p>
      </div>
    `

    await sendEmail({
      to,
      subject: `New Message from ${senderName}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send message notification:", error)
    return { success: false, error: "Failed to send message notification" }
  }
}
