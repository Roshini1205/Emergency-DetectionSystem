# YAMNet Emergency Detection AI Model

This directory contains the YAMNet-based audio classification model for detecting emergency sounds.

## Setup

1. **Install FFmpeg (required for audio processing):**
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # Or use conda
   conda install -c conda-forge ffmpeg
   ```

2. **Create Python virtual environment:**
   ```bash
   cd ai-model
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   ```bash
   python yamnet_server.py
   ```

   The server will start on `http://localhost:5050`

## API Endpoints

### Health Check
```bash
GET http://localhost:5050/health
```

### Analyze Audio File
```bash
POST http://localhost:5050/analyze
Content-Type: multipart/form-data

Body: audio file (WAV, MP3, etc.)
```

Example with curl:
```bash
curl -X POST -F "audio=@recording.wav" http://localhost:5050/analyze
```

### Real-time Stream Analysis
```bash
POST http://localhost:5050/stream-analyze
Content-Type: multipart/form-data

Body: audio chunk
```

## Response Format

```json
{
  "emergency_detected": true,
  "type": "Screaming",
  "confidence": 87.5,
  "detections": [
    {
      "class": "Screaming",
      "confidence": 87.5,
      "type": "Screaming"
    },
    {
      "class": "Shout",
      "confidence": 75.2,
      "type": "Screaming"
    }
  ]
}
```

## Emergency Sound Categories

- **Screaming**: Screams, shouts, yells, crying
- **Glass**: Glass breaking, shattering
- **Crash**: Crashes, bangs, slams, thumps
- **Alarm**: Fire alarms, smoke detectors, sirens
- **Cough**: Severe coughing, wheezing
- **Violence**: Gunshots, explosions

## Integration with Backend

The Node.js backend can call this Python service to analyze audio:

```javascript
// In Node.js backend
const FormData = require('form-data');
const axios = require('axios');

async function analyzeAudio(audioBuffer) {
  const formData = new FormData();
  formData.append('audio', audioBuffer, 'audio.wav');
  
  const response = await axios.post('http://localhost:5050/analyze', formData, {
    headers: formData.getHeaders()
  });
  
  return response.data;
}
```

## Notes

- YAMNet requires audio at 16kHz sample rate
- The model automatically resamples input audio
- First run downloads the model from TensorFlow Hub (~15MB)
- GPU acceleration available if TensorFlow GPU is installed
