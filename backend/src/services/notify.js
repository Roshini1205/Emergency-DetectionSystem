import nodemailer from 'nodemailer';
import twilio from 'twilio';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmergencyEmail({
  to,
  subject,
  text,
}) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS)' };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const info = await transporter.sendMail({ from, to, subject, text });
  return { sent: true, messageId: info.messageId };
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

export async function placeEmergencyCalls({
  toNumbers,
  message,
}) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!client || !from) {
    return {
      placed: false,
      reason: 'Missing Twilio configuration (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER)',
      calls: [],
    };
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${escapeForTwiML(
    message
  )}</Say></Response>`;

  const calls = [];
  for (const to of toNumbers) {
    try {
      const call = await client.calls.create({ to, from, twiml });
      calls.push({ to, sid: call.sid, status: call.status });
    } catch (err) {
      calls.push({ to, error: err?.message || 'Call failed' });
    }
  }

  return { placed: true, calls };
}

function escapeForTwiML(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
