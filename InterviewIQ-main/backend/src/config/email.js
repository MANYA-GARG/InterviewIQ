import nodemailer from 'nodemailer';

// ========== Gmail SMTP Configuration (Production-Ready) ==========
let transporter = null;
let smtpVerified = false;

const getEmailCredentials = () => {
  const user = process.env.EMAIL_USER?.trim();
  // App passwords can be copied with spaces; remove all spaces safely.
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim();

  if (!user || !pass) {
    console.log("DEBUG - EMAIL_USER:", user ? 'SET' : 'NOT SET');
    console.log("DEBUG - EMAIL_PASS:", pass ? 'SET' : 'NOT SET');
  }

  return { user, pass };
};

// Lazy initialization - creates transporter only when first needed
const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getEmailCredentials();

    if (!user || !pass) {
      throw new Error('EMAIL_USER or EMAIL_PASS is missing in backend .env');
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    // Verify SMTP connection on first use
    if (!smtpVerified) {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP Connection Failed:', error.message);
          console.error('   Check EMAIL_USER and EMAIL_PASS in .env file');
          console.error('   EMAIL_USER:', user ? 'SET' : 'NOT SET');
          console.error('   EMAIL_PASS:', pass ? 'SET' : 'NOT SET');
        } else {
          console.log('✅ SMTP Server Ready - Email service configured');
          smtpVerified = true;
        }
      });
    }
  }
  return transporter;
};

// Send email with proper error handling
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transport = getTransporter();
    const { user } = getEmailCredentials();
    const info = await transport.sendMail({
      from: `"InterviewIQ AI" <${user}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️  Email sent to ${to} - MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send OTP email specifically (returns boolean)
export const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    console.log('Sending OTP to:', email);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Email Verification - InterviewIQ</h2>
          <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
          <p style="color: #374151; font-size: 16px;">Your OTP verification code is:</p>
          <div style="background-color: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">⏰ This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">InterviewIQ - AI-Powered Interview Platform</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: '🔐 OTP Verification Code - InterviewIQ',
      html
    });

    if (result.success) {
      console.log(`✅ OTP sent successfully to ${email}`);
      return true;
    } else {
      console.error(`❌ OTP sending failed for ${email}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('[EMAIL] Failed to send OTP email:', error.message);
    console.error('[EMAIL] Stack:', error.stack);
    return false;
  }
};

export default getTransporter;
