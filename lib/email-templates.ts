import "server-only"

/**
 * Returns all email templates used in the application
 */
export function getEmailTemplates() {
  return {
    /**
     * Email verification template
     */
    verification: (name: string, role: string, verificationUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Verify Your Account</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Thank you for registering as a <strong>${role}</strong> in our School Management System. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you did not create an account, you can safely ignore this email.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">This verification link will expire in 24 hours.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="font-size: 14px; line-height: 1.5; color: #6B7280; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Password reset template
     */
    passwordReset: (name: string, resetUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you did not request a password reset, you can safely ignore this email.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">This password reset link will expire in 1 hour.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="font-size: 14px; line-height: 1.5; color: #6B7280; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Welcome email template
     */
    welcome: (name: string, role: string, loginUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to School Management System</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Welcome to our School Management System! Your account has been successfully created as a <strong>${role}</strong>.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">You can now log in to access your dashboard and all the features available to you.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">Log In to Your Account</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have any questions or need assistance, please don't hesitate to contact the school administration.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Notice email template
     */
    notice: (name: string, noticeTitle: string, noticeDetails: string, viewUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">New Notice</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">A new notice has been published:</p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <h2 style="color: #111827; margin-top: 0;">${noticeTitle}</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #374151;">${noticeDetails}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Notice</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Exam results email template
     */
    examResults: (parentName: string, studentName: string, examType: string, viewUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Exam Results Available</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${parentName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">We are pleased to inform you that the ${examType} results for ${studentName} are now available.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">You can view the detailed results by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Results</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have any questions about the results, please contact the class teacher.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Payment reminder email template
     */
    paymentReminder: (
      parentName: string,
      studentName: string,
      amount: number,
      dueDate: Date,
      paymentUrl: string,
    ): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Payment Reminder</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${parentName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">This is a friendly reminder about an upcoming payment for ${studentName}.</p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #374151;"><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
            <p style="font-size: 16px; line-height: 1.5; color: #374151;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">Make Payment</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have already made this payment, please disregard this reminder.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have any questions about this payment, please contact the school administration.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Attendance notification email template
     */
    attendanceNotification: (
      parentName: string,
      studentName: string,
      date: Date,
      status: string,
      viewUrl: string,
    ): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Attendance Notification</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${parentName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">This is to inform you about ${studentName}'s attendance record:</p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #374151;"><strong>Date:</strong> ${date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p style="font-size: 16px; line-height: 1.5; color: #374151;"><strong>Status:</strong> <span style="color: ${status.toLowerCase() === "present" ? "#10B981" : "#EF4444"};">${status}</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Attendance Record</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have any questions about this attendance record, please contact the class teacher.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Report card email template
     */
    reportCard: (parentName: string, studentName: string, term: string, viewUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Report Card Available</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${parentName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">We are pleased to inform you that ${studentName}'s report card for ${term} is now available.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">You can view and download the report card by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Report Card</a>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">If you have any questions about the report card, please contact the class teacher or school administration.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * New message email template
     */
    newMessage: (recipientName: string, senderName: string, messagePreview: string, viewUrl: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">New Message</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Hello ${recipientName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">You have received a new message from ${senderName}:</p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #374151; font-style: italic;">"${messagePreview}${messagePreview.length > 100 ? "..." : ""}"</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewUrl}" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Message</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Thank you,<br>School Management System</p>
        </div>
      </div>
    `,

    /**
     * Bulk email template
     */
    bulkEmail: (recipientName: string, message: string, senderName: string, schoolName: string): string => `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Message from ${schoolName}</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151;">Dear ${recipientName},</p>
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #374151;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 14px; color: #6B7280;">Regards,<br>${senderName}<br>${schoolName}</p>
        </div>
      </div>
    `,
  }
}
