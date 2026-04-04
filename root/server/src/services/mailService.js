import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

function hasSmtpConfiguration() {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass && env.mailFrom);
}

function getTransporter() {
  if (!hasSmtpConfiguration()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return transporter;
}

export function isSmtpConfigured() {
  return hasSmtpConfiguration();
}

export async function sendPasswordResetOtpEmail({ email, otp }) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    throw new Error('SMTP is not configured for OTP delivery.');
  }

  const subject = 'FleetTrack password reset OTP';
  const text = [
    'We received a request to reset your FleetTrack password.',
    '',
    `Your one-time password is: ${otp}`,
    `This OTP is valid for ${env.passwordResetOtpTtlMinutes} minutes.`,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0b1220;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;">FleetTrack Password Reset</h2>
      <p style="margin:0 0 12px;">We received a request to reset your FleetTrack password.</p>
      <p style="margin:0 0 12px;">Use this one-time password:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 12px;">${otp}</p>
      <p style="margin:0 0 12px;">This OTP is valid for ${env.passwordResetOtpTtlMinutes} minutes.</p>
      <p style="margin:0;color:#475569;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await activeTransporter.sendMail({
    from: env.mailFrom,
    to: email,
    subject,
    text,
    html,
  });
}
