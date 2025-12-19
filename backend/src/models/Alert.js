// const mongoose = require('mongoose');

// const alertSchema = new mongoose.Schema({
//   type: { type: String, required: true },
//   location: { type: String, required: true },
//   severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
//   confidence: { type: Number, min: 0, max: 100 },
//   status: { type: String, enum: ['active', 'resolved', 'dismissed'], default: 'active' },
//   transcript: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   resolvedAt: { type: Date },
//   resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
// });

// module.exports = mongoose.model('Alert', alertSchema);
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String,
    confidence: Number,
    severity: String,
    location: String,
    audioData: Buffer, // Store audio chunk if needed
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
