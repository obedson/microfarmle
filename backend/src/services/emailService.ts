import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();

// Only initialize if API key exists
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn('⚠️  BREVO_API_KEY not configured - emails will be logged only');
}

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
  
  if (!process.env.BREVO_API_KEY) {
    console.log(`[Email skipped] Password reset to: ${email}`);
    return;
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.sender = { 
    email: process.env.FROM_EMAIL || 'obedsonfield@gmail.com',
    name: 'Micro Farmle'
  };
  sendSmtpEmail.subject = 'Reset Your Password';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        Reset Password
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Password reset email sent to: ${email}`);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error?.response?.body || error.message);
    // Don't throw - just log
  }
};

const emailTemplates = {
  'new-booking': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Booking Request</h2>
      <p>You have received a new booking request for your property:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Property:</strong> ${data.propertyTitle}</p>
        <p><strong>Farmer:</strong> ${data.farmerName}</p>
        <p><strong>Check-in:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
        <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
      </div>
      <p>Please log in to your dashboard to review and respond to this booking request.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        View Booking
      </a>
    </div>
  `,
  'booking-status-update': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking ${data.status === 'confirmed' ? 'Confirmed' : 'Update'}</h2>
      <p>Your booking for <strong>${data.propertyTitle}</strong> has been ${data.status}.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Status:</strong> <span style="color: ${data.status === 'confirmed' ? '#10b981' : '#ef4444'}; text-transform: uppercase;">${data.status}</span></p>
        <p><strong>Check-in:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
        ${data.rejectionReason ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
      </div>
      ${data.status === 'confirmed' ? '<p>Please proceed with payment to complete your booking.</p>' : ''}
      <a href="${process.env.FRONTEND_URL}/my-bookings" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        View Booking
      </a>
    </div>
  `,
  'booking-cancelled': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Cancelled</h2>
      <p>A booking for <strong>${data.propertyTitle}</strong> has been cancelled by the ${data.cancelledBy}.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Check-in:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
        Go to Dashboard
      </a>
    </div>
  `
};

export const sendEmail = async ({ 
  to, 
  subject, 
  html, 
  template, 
  data 
}: { 
  to: string; 
  subject: string; 
  html?: string;
  template?: string;
  data?: any;
}) => {
  // Skip email if API key not configured
  if (!process.env.BREVO_API_KEY) {
    console.log(`[Email skipped] To: ${to}, Subject: ${subject}`);
    return;
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.sender = { 
    email: process.env.FROM_EMAIL || 'obedsonfield@gmail.com',
    name: 'Micro Farmle'
  };
  sendSmtpEmail.subject = subject;
  
  // Use template if provided, otherwise use html
  if (template && emailTemplates[template as keyof typeof emailTemplates]) {
    sendSmtpEmail.htmlContent = emailTemplates[template as keyof typeof emailTemplates](data);
  } else {
    sendSmtpEmail.htmlContent = html || '';
  }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to: ${to} - ${subject}`);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error?.response?.body || error.message);
    // Don't throw - just log the error
  }
};
