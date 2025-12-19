import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import { unlink } from "fs/promises";
import FormData from "form-data";
import Alert from "../models/Alert.js";

const router = express.Router();

// --------------------
// Multer Setup
// --------------------
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("audio/")) {
    return cb(new Error("Only audio files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

const PYTHON_API = "http://localhost:5050/analyze";

// --------------------
// POST /api/detect
// --------------------
router.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file received" });
  }

  try {
    // Prepare form data for Python API
    const formData = new FormData();
    formData.append(
      "audio",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );

    // Send audio to Python backend
    const response = await axios.post(PYTHON_API, formData, {
      headers: formData.getHeaders(),
      timeout: 30000, // 30 seconds
    });

    const result = response.data;
    console.log("🧠 YAMNet RESULT:", result);

    // Save alert if emergency detected
    if (result.emergency_detected) {
      const alert = await Alert.create({
        type: result.type || "Unknown",
        confidence: result.confidence || 0,
        severity: result.confidence >= 85 ? "high" : "medium",
        location: "Unknown",
      });

      return res.json({
        emergency: true,
        alert,
        detections: result.detections || [],
      });
    }

    // Normal response
    return res.json({
      emergency: false,
      detections: result.detections || [],
    });
  } catch (err) {
    console.error("❌ Detection failed:", err.message);
    if (err.response?.data) console.error("Python API response:", err.response.data);
    return res.status(500).json({ error: "Emergency detection failed" });
  } finally {
    // Delete uploaded file
    try {
      await unlink(req.file.path);
    } catch (err) {
      console.error("Failed to delete temp file:", err);
    }
  }
});

export default router;
