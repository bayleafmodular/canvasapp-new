import { BrevoClient } from '@getbrevo/brevo';

export const sendOtpEmail = async (toEmail: string, toName: string, otp: string): Promise<void> => {
  // If Brevo API key is not configured, log it and return (useful for dev fallbacks)
  if (!process.env.BREVO_API_KEY) {
    console.warn(`[Brevo Email Mock] Sending OTP "${otp}" to ${toName} <${toEmail}>`);
    return;
  }

  const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
  });

  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.SMTP_FROM_NAME || 'Canvas App',
      email: process.env.SMTP_FROM_EMAIL || 'testrq0173@gmail.com',
    },
    to: [{ email: toEmail, name: toName }],
    subject: 'Your verification OTP',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5;margin-bottom:8px">Verify your email</h2>
        <p style="color:#374151">Hi ${toName}, use the OTP below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#111827;text-align:center;padding:24px 0">${otp}</div>
        <p style="color:#6b7280;font-size:13px">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};
