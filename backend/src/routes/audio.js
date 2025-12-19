import express from 'express';
import FormData from 'form-data';
import axios from 'axios';
import multer from 'multer';
import Alert from '../models/Alert.js';
import { sendEmergencyNotification } from './notify.js';

const router = express.Router();

/* ===================== CONFIG ===================== */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // ⬅ safer 5MB
});

const YAMNET_API_URL = process.env.YAMNET_API_URL || 'http://localhost:5050';

const DANGER_CLASSES = [
  'scream',
  'cry',
  'glass',
  'gunshot',
  'explosion',
  'cough',
  'crash',
  'alarm',
  'violence'
];

const normalize = (txt = '') =>
  txt.toLowerCase().replace(/_/g, ' ').trim();

/* ===================== HEALTH ===================== */

router.get('/health', async (req, res) => {
  try {
    const ai = await axios.get(`${YAMNET_API_URL}/health`, { timeout: 5000 });
    res.json({ status: 'ok', aiModel: ai.data });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'AI model unavailable',
      error: err.message
    });
  }
});

/* ===================== FILE ANALYSIS ===================== */

router.post('/analyze', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio provided' });
  }

  try {
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await axios.post(
      `${YAMNET_API_URL}/analyze`,
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    );

    res.json({
      ...response.data,
      meta: {
        name: req.file.originalname,
        size: req.file.size,
        time: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Audio analysis failed',
      error: err.message
    });
  }
});

/* ===================== STREAM ANALYSIS ===================== */

router.post('/stream-analyze', upload.single('chunk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio chunk' });
  }

  const { userId, location } = req.body;

  try {
    const formData = new FormData();
    formData.append('chunk', req.file.buffer, {
      filename: 'chunk.webm',
      contentType: 'audio/webm'
    });

    console.log('Sending chunk to AI model:', `${YAMNET_API_URL}/stream-analyze`);
    
    const aiResponse = await axios.post(
      `${YAMNET_API_URL}/stream-analyze`,
      formData,
      { headers: formData.getHeaders(), timeout: 10000 }
    ).catch(err => {
      console.error('AI model connection error:', err.message);
      throw new Error(`AI model unavailable: ${err.message}`);
    });

    const { emergency_detected, type, confidence } = aiResponse.data || {};

    // ✅ STRICT VALIDATION
    const isDanger =
      emergency_detected === true &&
      confidence >= 40 &&
      DANGER_CLASSES.some(cls =>
        normalize(type).includes(cls)
      );

    if (isDanger && userId) {
      console.log('🚨 EMERGENCY DETECTED:', {
        type,
        confidence: Math.round(confidence),
        userId,
        location: location || 'Unknown'
      });

      const alert = await Alert.create({
        userId,
        type,
        confidence: Math.round(confidence),
        severity: confidence > 75 ? 'high' : 'medium',
        location: location || 'Unknown'
        // ❌ audioData REMOVED (very important)
      });

      console.log('✅ Alert saved to database:', alert._id);

      // 🔔 async notify
      sendEmergencyNotification(
        userId,
        type,
        alert.confidence,
        alert.location
      ).then(results => {
        console.log('📧 Notifications sent:', results);
      }).catch(err => {
        console.error('❌ Notification error:', err.message);
      });
    } else if (isDanger && !userId) {
      console.warn('⚠️ Emergency detected but no userId provided - cannot send notifications');
    }

    res.json(aiResponse.data);
  } catch (err) {
    console.error('Stream analysis error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({
      message: 'Stream analysis failed',
      error: err.message,
      details: err.response?.data || 'AI model connection failed'
    });
  }
});

/* ===================== DASHBOARD ===================== */

router.get('/recent-alerts', async (req, res) => {
  const alerts = await Alert.find()
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(
    alerts.map(a => ({
      id: a._id,
      type: a.type,
      confidence: a.confidence,
      severity: a.severity,
      location: a.location,
      time: a.createdAt
    }))
  );
});

/* ===================== DEBUG ===================== */

router.get('/check-storage', async (req, res) => {
  const alerts = await Alert.find().limit(5);
  res.json(alerts);
});

export default router;
