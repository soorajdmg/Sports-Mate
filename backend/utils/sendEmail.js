const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // Check if email is properly configured
  const isEmailConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !process.env.EMAIL_USER.includes('your-email') &&
    !process.env.EMAIL_PASS.includes('your-app-password');

  if (!isEmailConfigured) {
    console.log('========================================');
    console.log('EMAIL NOT CONFIGURED - Skipping send');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('========================================');
    return; // Skip sending in dev mode
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Sports Teammate Finder" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp, purpose) => {
  // Always log OTP to console in development for testing
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
