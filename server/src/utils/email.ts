import sgMail from "@sendgrid/mail";

const SENDGRID_KEY = process.env.SENDGRID_API_KEY || "";
const EMAIL_ENABLED = SENDGRID_KEY.startsWith("SG.");

if (EMAIL_ENABLED) {
  sgMail.setApiKey(SENDGRID_KEY);
}

export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  if (!EMAIL_ENABLED) {
    console.log(`[Email skipped] Verification email for ${to}, token: ${token}`);
    return;
  }
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const msg = {
    to,
    from: process.env.FROM_EMAIL || "noreply@example.com",
    subject: "Verify Your Email — Project Manager",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Welcome to Project Manager, ${name}! 👋</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
        <p style="color:#9ca3af;margin-top:20px;font-size:14px;">This link expires in 24 hours.</p>
      </div>
    `,
  };
  await sgMail.send(msg);
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  if (!EMAIL_ENABLED) {
    console.log(`[Email skipped] Password reset for ${to}, token: ${token}`);
    return;
  }
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const msg = {
    to,
    from: process.env.FROM_EMAIL || "noreply@example.com",
    subject: "Reset Your Password — Project Manager",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#4f46e5;">Password Reset Request</h2>
        <p>Hi ${name}, you requested to reset your password. Click below:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#9ca3af;margin-top:20px;font-size:14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };
  await sgMail.send(msg);
};
