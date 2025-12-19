# Emergency Detection System - Project Analysis

## Overview
The Emergency Detection System is a full-stack application designed to detect emergency sounds (screaming, crashes, alarms, gunshots, etc.) in real-time audio streams and alert emergency contacts via email/SMS. It uses AI-powered audio classification with YAMNet and provides a web-based dashboard for monitoring.

---

## 📊 Architecture

### Three-Tier Architecture
```
Frontend (React + Vite)  →  Backend (Node.js + Express)  →  AI Model (Python Flask)
Port 5173              →  Port 4001                      →  Port 5000/5050
```

---

## 🏗️ Project Structure

### **1. Frontend** (React + Vite)
**Location:** `/frontend`
**Port:** 5173

#### Stack:
- React 18.2.0
- React Router DOM 6.30.2
- Tailwind CSS 3.4.19
- Vite 5.0.8
- Lucide React (icons)

#### Pages:
- **Home.jsx** (696 lines) - Landing page with features & CTA
- **Signup.jsx** - User registration
- **Signin.jsx** - User login
- **EmergencyDashboard.jsx** - Main monitoring dashboard
- **Alert.jsx** - Alert details & history
- **Settings.jsx** - User settings & emergency contacts

#### Services:
- **api.js** - Axios instance with JWT auth interceptor
  - Base URL: `http://localhost:5000/api` ⚠️ **NOTE: Should be 4001 for backend**

#### Build Config:
- Tailwind CSS + PostCSS
- ESLint configured

---

### **2. Backend** (Node.js + Express)
**Location:** `/backend`
**Port:** 4001

#### Stack:
- Express 4.22.1
- MongoDB + Mongoose 7.8.8
- JWT Authentication
- Bcrypt (password hashing)
- Multer (file uploads)
- Nodemailer (email)
- Twilio (SMS/calls)
- Axios (HTTP client)

#### Routes:
1. **`/api/auth`** (auth.js)
   - POST `/signup` - User registration with emergency contacts
   - POST `/signin` - User login
   - Validation with Joi
   - Emergency contacts required on signup

2. **`/api/audio`** (audio.js)
   - GET `/health` - Health check (AI model status)
   - POST `/analyze` - Audio analysis with file upload
   - 5MB file limit

3. **`/api/detect`** (detect.js) - ⚠️ **POTENTIAL DUPLICATE**
   - POST `/` - Audio detection
   - 10MB file limit
   - Saves alerts to MongoDB

4. **`/api/notify`** (notify.js)
   - POST `/emergency` - Send alerts via email/SMS
   - Supports multiple emergency contacts

5. **`/api/user`** (user.js)
   - User CRUD operations

#### Models:

**User Schema:**
```javascript
{
  name: String (required)
  email: String (required, unique)
  phone: String (required)
  emergencyContacts: Array of {
    name: String
    email: String (required)
    phone: String (required)
  }
  passwordHash: String (required)
  createdAt, updatedAt: Timestamps
}
```

**Alert Schema:**
```javascript
{
  userId: ObjectId → User
  type: String (e.g., "Screaming", "Glass", "Crash")
  confidence: Number (0-100)
  severity: String ("low", "medium", "high")
  location: String
  audioData: Buffer (optional)
  createdAt, updatedAt: Timestamps
}
```

#### Middleware:
- **auth.js** - JWT validation
  - Extracts Bearer token from Authorization header
  - Verifies JWT signature
  - Attaches `req.auth.userId` to request

#### Services:
- **notify.js** - Email & SMS notification service
  - SMTP configuration
  - Twilio integration
  - Error handling for missing configs

#### Issues Found:
1. ✅ Uses ES6 modules (type: "module" in package.json)
2. ❌ Duplicate detection routes (`/api/audio/analyze` and `/api/detect`)
3. ❌ `api.js` frontend service points to wrong base URL (5000 instead of 4001)
4. ⚠️ No error handling middleware
5. ⚠️ No request validation on most routes

---

### **3. AI Model** (Python + TensorFlow)
**Location:** `/ai-model`
**Port:** 5000 (or 5050 as fallback)

#### Stack:
- TensorFlow 2.13.0+
- TensorFlow Hub
- YAMNet pretrained model (Google's audio classifier)
- Flask 2.3.2
- Flask-CORS
- Librosa (audio processing)
- SoundFile
- Pandas (CSV handling)

#### Key Features:
- **YAMNet Model:**
  - Pretrained on AudioSet
  - Classifies 521 audio events
  - Returns class names from CSV map

- **Emergency Sound Classes:**
```python
EMERGENCY_CLASSES = {
  "Screaming": ["Screaming", "Shout", "Yell", "Crying"],
  "Glass": ["Glass", "Shatter", "Breaking"],
  "Crash": ["Crash", "Bang", "Slam", "Thump"],
  "Alarm": ["Alarm", "Smoke detector", "Fire alarm", "Siren"],
  "Violence": ["Gunshot", "Explosion", "Fighting"],
}
```

#### API Endpoints:
1. **GET `/health`** - Health check
2. **POST `/analyze`** - Analyze single audio file
3. **POST `/stream-analyze`** - Real-time stream analysis

#### Processing:
- Uses FFmpeg for audio conversion → WAV
- 16kHz sample rate (YAMNet requirement)
- Mono audio
- Detects confidence scores
- Caches loaded model globally

#### Issues Found:
1. ⚠️ SSL verification disabled (`ssl._create_unverified_context`)
2. ⚠️ Global model state management (potential race conditions)
3. ❌ Backend calls port 5050 but Python server listens on 5000
4. ⚠️ FFmpeg path handling may fail in certain environments

---

## 🔄 Communication Flow

### Detection Flow:
```
User/System
    ↓
Frontend (React)
    ↓ (POST /api/audio/analyze OR /api/detect)
Backend (Node.js:4001)
    ↓ (axios to 5000/5050)
AI Model (Python:5000)
    ↓
Audio Classification (YAMNet)
    ↓ (JSON response)
Backend Receives Results
    ↓ (if emergency_detected)
Save Alert to MongoDB
    ↓
Send Notifications (Email/SMS)
    ↓
Response to Frontend
```

---

## 🚨 Critical Issues

### **1. Port Mismatch - CRITICAL** ⚠️
- Frontend API service: `http://localhost:5000/api`
- Backend server: Port 4001
- **Fix:** Update [frontend/services/api.js](frontend/services/api.js) baseURL to `http://localhost:4001/api`

### **2. Duplicate Detection Routes** ⚠️
- `POST /api/audio/analyze` (audio.js)
- `POST /api/detect` (detect.js)
- Both handle audio file uploads and detection
- **Decision needed:** Consolidate routes or clarify distinction

### **3. Python Server Port Configuration** ⚠️
- Backend code calls: `http://localhost:5050/analyze`
- Python server likely listens on: `http://localhost:5000`
- **Fix:** Standardize port number (recommend 5000)

### **4. CommonJS vs ES6 Modules Mismatch**
- Backend uses ES6 imports
- Old authController.js uses `require()` and `exports`
- **Status:** Appears to have been partially converted

### **5. Missing Environment Variables**
- `.env` file not provided
- Required: MONGODB_URI, JWT_SECRET, EMAIL credentials, Twilio config
- **Impact:** App won't run without proper config

---

## 📋 Database Schema Analysis

### Collections:
1. **users** - 3 indexes (default _id, email unique, phone)
2. **alerts** - Links to users, tracks emergency detections
3. **Missing:** Emergency contact notification logs?

---

## 🔐 Security Observations

### Strengths:
✅ Password hashing with bcrypt (10 rounds)
✅ JWT authentication on protected routes
✅ CORS configured
✅ Input validation with Joi
✅ File upload restrictions (size limits, MIME types)

### Weaknesses:
❌ No HTTPS/TLS in development
❌ JWT secret stored in .env (standard, but needs protection)
❌ No rate limiting on auth endpoints
❌ No request logging/audit trail
❌ SSL verification disabled in Python server
❌ Emergency contacts sent in plain email (consider encryption)
❌ Audio files stored in uploads folder without cleanup

---

## 📦 Dependencies Analysis

### Frontend:
- React ecosystem solid
- Tailwind CSS for styling
- Lucide for icons

### Backend:
- All major packages up-to-date (2023-2024)
- Good coverage: auth, DB, files, notifications
- **Missing:** Input sanitization, request logger, helmet security

### AI Model:
- TensorFlow ecosystem standard
- FFmpeg dependency external
- **Issue:** TensorFlow 2.13+ for Apple Silicon requires special config

---

## 🎯 Functional Features

### Implemented:
1. ✅ User authentication (signup/signin)
2. ✅ Emergency contact management
3. ✅ Audio upload and analysis
4. ✅ Emergency sound detection
5. ✅ Email notification system
6. ✅ SMS/call notification system (Twilio)
7. ✅ Alert storage in MongoDB
8. ✅ Dashboard UI

### Not Fully Implemented / Needs Verification:
- ⚠️ Real-time stream analysis
- ⚠️ Location detection/tracking
- ⚠️ Alert history/queries
- ⚠️ User settings persistence

---

## 📱 Frontend Components Status

- **Home.jsx** (696 lines) - Full landing page
- **Dashboard** - Requires integration testing
- **Alert Page** - List/detail view
- **Settings** - Emergency contact management
- **Auth Pages** - Login/Signup flows

---

## 🚀 Deployment Readiness

### Not Ready For Production:
- ❌ Port conflicts need resolution
- ❌ .env configuration incomplete
- ❌ No error handling on critical paths
- ❌ No logging/monitoring
- ❌ No API documentation/OpenAPI spec
- ❌ No testing (unit/integration/e2e)
- ❌ No Docker setup

### Before Production:
- [ ] Fix port mismatches
- [ ] Add comprehensive error handling
- [ ] Implement request logging
- [ ] Add rate limiting
- [ ] Setup HTTPS/TLS
- [ ] Add API documentation
- [ ] Create test suite
- [ ] Configure proper .env variables
- [ ] Add health monitoring
- [ ] Cleanup old audio files
- [ ] Add database indexes/optimization

---

## 🔧 Technical Debt

1. **Code Organization:** Some routes very long (audio.js 171 lines)
2. **Error Handling:** Minimal logging and error context
3. **Validation:** Not consistent across all routes
4. **Documentation:** Minimal inline comments
5. **Configuration:** Hard-coded URLs in some places
6. **Testing:** No test suite found

---

## 📌 Recommendations

### High Priority:
1. Fix frontend API baseURL
2. Standardize Python/Node port configuration
3. Consolidate detection routes
4. Add .env configuration guide
5. Add error handling middleware

### Medium Priority:
1. Add request/response logging
2. Implement rate limiting
3. Add comprehensive input validation
4. Create API documentation
5. Add unit tests

### Low Priority:
1. Refactor large route files
2. Add TypeScript
3. Implement caching layer
4. Add monitoring/alerting
5. Setup CI/CD pipeline

---

## 📐 File Count Summary

```
Frontend:    6 pages + services + assets + configs
Backend:     6 routes + 2 models + 2 controllers + middleware + services
AI Model:    1 main server + YAMNet model files
Total:       ~15 source files + configs + models
```

---

## 🎓 Overall Assessment

**Maturity Level:** MVP / Early Development
**Code Quality:** 6/10 (Good foundation, needs polish)
**Completeness:** 7/10 (Core features present, edge cases missing)
**Production Ready:** 3/10 (Needs fixes and hardening)

The project has solid architecture and good separation of concerns. Core features are implemented. Main issues are configuration/integration problems rather than fundamental design flaws. With the recommended fixes, this could be production-ready within 1-2 weeks.

