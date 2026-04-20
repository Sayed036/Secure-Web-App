const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2>Your verification code</h2>
      <p>Use this code to verify your email. It expires in ${process.env.OTP_TTL_MIN || 10} minutes.</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;background:#f4f4f5;padding:16px;text-align:center;border-radius:8px">${otp}</div>
      <p style="color:#666;font-size:12px">If you didn't request this, ignore this email.</p>
    </div>`;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your verification code',
    html,
  });
}

module.exports = { sendOtpEmail };
