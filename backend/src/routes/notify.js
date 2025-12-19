import express from 'express';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import User from '../models/User.js';

const router = express.Router();

/* ===========================
   EMAIL CONFIGURATION
=========================== */
console.log('📧 Email Configuration Check:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configured' : '❌ Missing');

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
  console.log('📬 Starting emergency notification process...');
  console.log('   User ID:', userId);
  console.log('   Type:', type);
  console.log('   Confidence:', confidence);
  console.log('   Location:', location);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      throw new Error('User not found');
    }

    console.log('✅ User found:', user.name, '(' + user.email + ')');

    const contacts = user.emergencyContacts;
    if (!contacts || contacts.length === 0) {
      console.warn('⚠️ No emergency contacts found for user:', user.name);
      throw new Error('No emergency contacts found');
    }

    console.log('📋 Emergency contacts:', contacts.length);
    contacts.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name || 'Unnamed'} - ${c.email}`);
    });

    const timestamp = new Date().toLocaleString();
    const results = { email: 0, call: 0, errors: [] };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('📧 Starting email sending process...');
      
      // Verify transporter connection before sending
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('❌ SMTP connection failed:', verifyError.message);
        results.errors.push(`SMTP connection failed: ${verifyError.message}`);
        return results;
      }

      // Create array of all recipients: user's own email + emergency contacts
      const allRecipients = [
        { email: user.email, name: user.name, isUser: true },
        ...contacts.map(c => ({ email: c.email, name: c.name, isUser: false }))
      ];

      await Promise.all(
        allRecipients.map((recipient) => {
          if (!recipient.email) return Promise.resolve();

          console.log(`   📤 Attempting to send email to: ${recipient.email}`);

          // Customize email subject and content based on recipient type
          const emailSubject = recipient.isUser 
            ? `🚨 Emergency Detected: ${type} Alert - Check Your Safety!`
            : `🚨 URGENT: ${type} Alert - ${user.name} Needs Help!`;

          const emailGreeting = recipient.isUser
            ? `<p style="margin: 0 0 15px 0; color: #d32f2f; font-size: 16px;">Dear ${user.name},</p>
               <p style="margin: 0 0 20px 0; color: #424242;">Our AI system has detected an emergency sound from your device. This is an automatic safety notification.</p>`
            : `<p style="margin: 0 0 20px 0; color: #424242;">You are receiving this alert because you are listed as an emergency contact for ${user.name}.</p>`;

          return transporter
            .sendMail({
              from: `"SafeSound AI - Emergency Alert" <${process.env.EMAIL_USER}>`,
              to: recipient.email,
              subject: emailSubject,
              html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
                    <p style="color: #ffebee; margin: 10px 0 0 0; font-size: 16px;">Immediate Attention Required</p>
                  </div>
                  
                  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${emailGreeting}
                    
                    <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                      <h2 style="margin: 0 0 5px 0; color: #e65100; font-size: 20px;">${type} Detected!</h2>
                      <p style="margin: 0; color: #bf360c; font-size: 24px; font-weight: bold;">${confidence}% Confidence</p>
                    </div>

                    <h3 style="color: #d32f2f; margin: 20px 0 15px 0; font-size: 18px; border-bottom: 2px solid #ffcdd2; padding-bottom: 10px;">👤 Person in Danger</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #e0e0e0;">Full Name:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${user.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Email Address:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${user.email}</td>
                      </tr>
                      <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Phone Number:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #1976d2; font-weight: bold; font-size: 16px;">
                          <a href="tel:${user.phone}" style="color: #1976d2; text-decoration: none;">${user.phone}</a>
                        </td>
                      </tr>
                    </table>

                    <h3 style="color: #d32f2f; margin: 20px 0 15px 0; font-size: 18px; border-bottom: 2px solid #ffcdd2; padding-bottom: 10px;">📍 Alert Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #e0e0e0;">Location:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${location}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Time of Alert:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${timestamp}</td>
                      </tr>
                      <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e0e0e0;">Alert Type:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #d32f2f; font-weight: bold;">${type}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; font-weight: bold;">Detection Accuracy:</td>
                        <td style="padding: 12px; color: #2e7d32; font-weight: bold;">${confidence}%</td>
                      </tr>
                    </table>

                    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #0d47a1; font-size: 14px;">
                        <strong>⚠️ Action Required:</strong> This is an automated emergency alert. 
                        <strong>${user.name}</strong> may need immediate assistance. Please try to contact them or check their location.
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                      <a href="tel:${user.phone}" style="display: inline-block; background: #2196f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 5px;">
                        📞 Call ${user.name}
                      </a>
                      <a href="sms:${user.phone}" style="display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 5px;">
                        💬 Send SMS
                      </a>
                    </div>

                    <div style="margin-top: 30px; padding: 20px; background: #fafafa; border-radius: 5px; text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        This alert was sent by <strong>SafeSound AI Emergency Detection System</strong><br/>
                        You are receiving this because you are listed as an emergency contact for ${user.name}.
                      </p>
                    </div>
                  </div>
                </div>
              `,
            })
            .then(() => {
              results.email++;
              console.log(`   ✅ Email sent to: ${recipient.email}`);
            })
            .catch((e) => {
              const errMsg = `Email failed (${recipient.email}): ${e.message}`;
              results.errors.push(errMsg);
              console.error(`   ❌ ${errMsg}`);
            });
        })
      );
      console.log(`📧 Total emails sent: ${results.email}`);
    } else {
      console.warn('⚠️ Email not configured (missing EMAIL_USER or EMAIL_PASS)');
    }
    
    /* ===========================
       MAKE CALLS (TWILIO)
    =========================== */
    if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
      console.log('📞 Starting phone call process...');
      
      // Create array of all phone recipients: user + emergency contacts
      const allPhoneRecipients = [
        { phone: user.phone, name: user.name, isUser: true },
        ...contacts.map(c => ({ phone: c.phone, name: c.name, isUser: false }))
      ];

      await Promise.all(
        allPhoneRecipients.map((recipient) => {
          if (!recipient.phone) return Promise.resolve();

          // ✅ Normalize Indian phone number
          const toNumber = recipient.phone.startsWith('+')
            ? recipient.phone
            : `+91${recipient.phone}`;
          
          console.log(`   📞 Calling: ${recipient.name} at ${toNumber}`);

          // Customize call message based on recipient
          const callMessage = recipient.isUser
            ? `Emergency alert from Safe Sound AI. A ${type} sound was detected from your device. This is an automatic safety notification. Please check your surroundings immediately.`
            : `Emergency alert from Safe Sound AI. A ${type} sound was detected for ${user.name}. Please check immediately.`;

          return twilioClient.calls
            .create({
              to: toNumber,
              from: process.env.TWILIO_FROM_NUMBER,
              twiml: `
              <Response>
                <Say>${callMessage}</Say>
              </Response>
            `,
            })
            .then(() => {
              results.call++;
              console.log(`   ✅ Call initiated to: ${toNumber}`);
            })
            .catch((e) => {
              console.error(`   ❌ Call failed to ${toNumber}:`, e.message);
              results.errors.push(`Call failed (${toNumber}): ${e.message}`);
            });
        })
      );
      
      console.log(`📞 Phone calls completed: ${results.call} successful`);
    } else {
      console.warn('⚠️ Twilio not configured (missing TWILIO_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER)');
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

/* ===========================
   TEST EMAIL ENDPOINT
=========================== */
router.post('/test-email', async (req, res) => {
  const { testEmail } = req.body;
  
  console.log('🧪 Testing email system...');
  console.log('   Test email address:', testEmail || 'Not provided');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({
      success: false,
      message: 'Email not configured. Check EMAIL_USER and EMAIL_PASS in .env'
    });
  }

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Send test email
    const info = await transporter.sendMail({
      from: `"SafeSound AI Test" <${process.env.EMAIL_USER}>`,
      to: testEmail || process.env.EMAIL_USER,
      subject: '🧪 Test Email from SafeSound AI',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#4caf50;">✅ Email System Working!</h2>
          <p>This is a test email from your Emergency Detection System.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
          <p>If you received this, your email configuration is correct! 🎉</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);

    return res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      from: process.env.EMAIL_USER,
      to: testEmail || process.env.EMAIL_USER
    });
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

export default router;
