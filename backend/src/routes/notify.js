import express from 'express';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import User from '../models/User.js';

const router = express.Router();

/* ===========================
   EMAIL CONFIGURATION
=========================== */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // 16-char Gmail App Password
  },
  logger: true, // Optional: logs email sending
  debug: true,  // Optional: shows debug info
});

/* ===========================
   TWILIO CONFIGURATION
=========================== */
const twilioClient =
  process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export const sendEmergencyNotification = async (userId, type, confidence, location) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const contacts = user.emergencyContacts;
    if (!contacts || contacts.length === 0) throw new Error('No emergency contacts found');

    const timestamp = new Date().toLocaleString();
    const results = { email: 0, call: 0, errors: [] };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await Promise.all(
        contacts.map((contact) => {
          if (!contact.email) return Promise.resolve();

          return transporter
            .sendMail({
              from: `"SafeSound AI" <${process.env.EMAIL_USER}>`,
              to: contact.email,
              subject: `🚨 EMERGENCY ALERT: ${type} Detected`,
              html: `
                <div style="font-family: Arial; padding: 20px;">
                  <h2 style="color:#d32f2f;">🚨 Emergency Alert</h2>
                  <p><strong>Type:</strong> ${type}</p>
                  <p><strong>Confidence:</strong> ${confidence}%</p>
                  <p><strong>Location:</strong> ${location}</p>
                  <p><strong>Time:</strong> ${timestamp}</p>
                  <hr/>
                  <p><strong>User:</strong> ${user.name}</p>
                  <p><strong>Phone:</strong> ${user.phone}</p>
                </div>
              `,
            })
            .then(() => results.email++)
            .catch((e) =>
              results.errors.push(`Email failed (${contact.email}): ${e.message}`)
            );
        })
      );
    }
    
    /* ===========================
       MAKE CALLS (TWILIO)
    =========================== */
    if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
      await Promise.all(
        contacts.map((contact) => {
          if (!contact.phone) return Promise.resolve();

          // ✅ Normalize Indian phone number
          const toNumber = contact.phone.startsWith('+')
            ? contact.phone
            : `+91${contact.phone}`;

          return twilioClient.calls
            .create({
              to: toNumber,
              from: process.env.TWILIO_FROM_NUMBER,
              twiml: `
              <Response>
                <Say>
                  Emergency alert from Safe Sound AI.
                  A ${type} sound was detected for ${user.name}.
                  Please check immediately.
                </Say>
              </Response>
            `,
            })
            .then(() => results.call++)
            .catch((e) =>
              results.errors.push(`Call failed (${toNumber}): ${e.message}`)
            );
        })
      );
    }

    return results;
  } catch (error) {
    console.error('Notification Error:', error);
    throw error;
  }
};

/* ===========================
   EMERGENCY NOTIFICATION API
   (AI → Backend)
=========================== */
router.post('/emergency', async (req, res) => {
  const { userId, type, confidence, location } = req.body;

  if (!userId || !type || !confidence || !location) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  try {
    const results = await sendEmergencyNotification(userId, type, confidence, location);
    return res.json({
      success: true,
      message: `Notifications sent successfully`,
      emailsSent: results.email,
      callsMade: results.call,
      errors: results.errors.length ? results.errors : undefined,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
