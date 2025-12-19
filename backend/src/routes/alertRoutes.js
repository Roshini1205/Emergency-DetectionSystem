import express from 'express';
import FormData from 'form-data';
import axios from 'axios';
import multer from 'multer';
import Alert from '../models/Alert.js';
import { sendEmergencyNotification } from '../utils/notify.js';

const router = express.Router();

// ================= CONFIG =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const YAMNET_API_URL = process.env.YAMNET_API_URL || 'http://localhost:5050';

const DANGER_CLASSES = ['scream','cry','glass','gunshot','explosion','cough','crash'];
const normalize = txt => txt.toLowerCase().replace(/_/g,' ').trim();

// ================= HEALTH =================
router.get('/health', async (req,res) => {
  try {
    const ai = await axios.get(`${YAMNET_API_URL}/health`, { timeout: 5000 });
    res.json({ status: 'ok', aiModel: ai.data });
  } catch(err) {
    res.status(503).json({ status:'error', message:'AI model unavailable', error: err.message });
  }
});

// ================= FILE ANALYSIS =================
router.post('/analyze', upload.single('audio'), async (req,res) => {
  if(!req.file) return res.status(400).json({ message:'No audio provided' });

  try {
    const formData = new FormData();
    formData.append('audio', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    const response = await axios.post(`${YAMNET_API_URL}/analyze`, formData, { headers: formData.getHeaders(), timeout: 30000 });

    res.json({
      ...response.data,
      meta: { name: req.file.originalname, size: req.file.size, time: new Date().toISOString() }
    });
  } catch(err) {
    res.status(500).json({ message:'Audio analysis failed', error: err.message });
  }
});

// ================= STREAM ANALYSIS =================
router.post('/stream-analyze', upload.single('chunk'), async (req,res) => {
  if(!req.file) return res.status(400).json({ message:'No audio chunk' });

  const { userId, location } = req.body;

  try {
    const formData = new FormData();
    formData.append('chunk', req.file.buffer, { filename:'chunk.webm', contentType:'audio/webm' });

    const aiResponse = await axios.post(`${YAMNET_API_URL}/stream-analyze`, formData, { headers: formData.getHeaders(), timeout: 10000 });

    const { emergency_detected, type, confidence } = aiResponse.data || {};

    const isDanger = emergency_detected === true && confidence >= 40 && DANGER_CLASSES.some(cls => normalize(type).includes(cls));

    if(isDanger && userId){
      const alert = await Alert.create({
        userId,
        type,
        confidence: Math.round(confidence),
        severity: confidence > 75 ? 'high':'medium',
        location: location || 'Unknown'
      });

      sendEmergencyNotification(userId, type, alert.confidence, alert.location).catch(console.error);
    }

    res.json(aiResponse.data);

  } catch(err){
    console.error('Stream error:', err.message);
    res.status(500).json({ message:'Stream analysis failed', error: err.message });
  }
});

// ================= DASHBOARD =================
router.get('/recent-alerts', async (req,res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
  res.json(alerts.map(a => ({
    id: a._id,
    type: a.type,
    confidence: a.confidence,
    severity: a.severity,
    location: a.location,
    time: a.createdAt
  })));
});

// ================= DEBUG =================
router.get('/check-storage', async (req,res) => {
  const alerts = await Alert.find().limit(5);
  res.json(alerts);
});

export default router;
