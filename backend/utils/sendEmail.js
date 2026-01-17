const { Resend } = require('resend');

// Initialize Resend with API key
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const sendEmail = async ({ to, subject, html }) => {
  const resend = getResendClient();

  if (!resend) {
    console.log('========================================');
    console.log('RESEND NOT CONFIGURED - Skipping send');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('========================================');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Sports Teammate Finder <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully to:', to, 'ID:', data?.id);
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw error;
  }
};

const sendOTPEmail = async (email, otp, purpose) => {
  // Always log OTP to console for debugging
  console.log('========================================');
  console.log(`OTP for ${email}: ${otp}`);
  console.log(`Purpose: ${purpose}`);
  console.log('========================================');

  const subject = purpose === 'signup'
    ? 'Verify your email - Sports Teammate Finder'
    : 'Login OTP - Sports Teammate Finder';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sports Teammate Finder</h1>
        </div>
        <div class="content">
          <h2>${purpose === 'signup' ? 'Welcome!' : 'Welcome back!'}</h2>
          <p>Your one-time password (OTP) for ${purpose === 'signup' ? 'account verification' : 'login'} is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>This OTP is valid for 5 minutes.</strong></p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

module.exports = { sendEmail, sendOTPEmail };
