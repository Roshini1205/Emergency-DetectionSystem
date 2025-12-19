import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // ✅ loads .env automatically
import { connectDB } from './config/db.js';

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 4001;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

// Middlewares
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Routes
import authRoutes from './routes/auth.js';
import audioRoutes from './routes/audio.js';
import userRoutes from './routes/user.js';
import notifyRoutes from './routes/notify.js';

app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notify', notifyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
