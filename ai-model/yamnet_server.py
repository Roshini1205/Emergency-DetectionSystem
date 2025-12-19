import os
import sys
import ssl
import json
import tempfile
import subprocess
import threading
import traceback

import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow_hub as hub
import soundfile as sf
from flask import Flask, request, jsonify
from flask_cors import CORS

# ===============================
# ENV & SSL FIXES
# ===============================
ssl._create_default_https_context = ssl._create_unverified_context

# Ensure ffmpeg is visible (important for conda/env)
env_bin = os.path.dirname(sys.executable)
os.environ["PATH"] = env_bin + os.pathsep + os.environ.get("PATH", "")

# ===============================
# FLASK APP
# ===============================
app = Flask(__name__)
CORS(app)

# ===============================
# CONFIG
# ===============================
YAMNET_MODEL_HANDLE = os.environ.get(
    "YAMNET_MODEL_HANDLE", "https://tfhub.dev/google/yamnet/1"
)

# ===============================
# GLOBALS
# ===============================
_model_lock = threading.Lock()
yamnet_model = None
class_names = None
model_error = None

# ===============================
# EMERGENCY CLASSES
# ===============================
EMERGENCY_CLASSES = {
    "Screaming": ["Screaming", "Shout", "Yell", "Crying"],
    "Glass": ["Glass", "Shatter", "Breaking"],
    "Crash": ["Crash", "Bang", "Slam", "Thump"],
    "Alarm": ["Alarm", "Smoke detector", "Fire alarm", "Siren"],
    "Violence": ["Gunshot", "Explosion", "Fighting"],
}

# ===============================
# LOAD YAMNET (ONCE)
# ===============================
def load_yamnet():
    global yamnet_model, class_names, model_error

    if yamnet_model is not None:
        return yamnet_model, class_names

    with _model_lock:
        try:
            print("🔄 Loading YAMNet model...")
            yamnet_model = hub.load(YAMNET_MODEL_HANDLE)

            class_map_path = yamnet_model.class_map_path().numpy().decode()
            class_df = pd.read_csv(class_map_path)
            class_names = class_df["display_name"].tolist()

            print("✅ YAMNet loaded successfully")
            return yamnet_model, class_names

        except Exception as e:
            model_error = str(e)
            print("❌ Failed to load YAMNet:", model_error)
            return None, None


# ===============================
# AUDIO LOADER (ffmpeg → wav)
# ===============================
def load_audio(file_storage):
    temp_input = None
    temp_wav = None

    try:
        with tempfile.NamedTemporaryFile(delete=False) as f:
            file_storage.save(f)
            temp_input = f.name

        temp_wav = temp_input + ".wav"

        cmd = [
            "ffmpeg", "-y",
            "-i", temp_input,
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            temp_wav
        ]

        result = subprocess.run(cmd, capture_output=True)

        if result.returncode != 0:
            print("FFmpeg error:", result.stderr.decode())
            return None

        audio, _ = sf.read(temp_wav, dtype="float32")
        return audio

    except Exception as e:
        traceback.print_exc()
        return None

    finally:
        for f in [temp_input, temp_wav]:
            if f and os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass


# ===============================
# EMERGENCY CLASSIFIER
# ===============================
def classify(scores, class_names):
    emergency = False
    max_conf = 0.0
    detected_type = "Unknown"
    detections = []

    top_indices = np.argsort(scores)[-10:][::-1]

    for idx in top_indices:
        name = class_names[idx]
        conf = float(scores[idx]) * 100

        for e_type, keywords in EMERGENCY_CLASSES.items():
            if any(k.lower() in name.lower() for k in keywords):
                emergency = True
                detections.append({
                    "class": name,
                    "confidence": round(conf, 2),
                    "type": e_type
                })

                if conf > max_conf:
                    max_conf = conf
                    detected_type = e_type

    return {
        "emergency_detected": emergency,
        "type": detected_type,
        "confidence": round(max_conf, 2),
        "detections": detections[:5]
    }


# ===============================
# ROUTES
# ===============================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "YAMNet",
        "loaded": yamnet_model is not None,
        "error": model_error
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file"}), 400

        audio = load_audio(request.files["audio"])
        if audio is None:
            return jsonify({"error": "Invalid audio"}), 400

        model, names = load_yamnet()
        if model is None:
            return jsonify({"error": model_error}), 500

        waveform = tf.convert_to_tensor(audio, dtype=tf.float32)
        scores, _, _ = model(waveform)
        mean_scores = np.mean(scores.numpy(), axis=0)

        result = classify(mean_scores, names)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/stream-analyze", methods=["POST"])
def stream_analyze():
    try:
        if "chunk" not in request.files:
            return jsonify({"error": "No audio chunk"}), 400

        audio = load_audio(request.files["chunk"])
        if audio is None:
            return jsonify({"error": "Invalid chunk"}), 400

        model, names = load_yamnet()
        waveform = tf.convert_to_tensor(audio, dtype=tf.float32)
        scores, _, _ = model(waveform)
        max_scores = np.max(scores.numpy(), axis=0)

        result = classify(max_scores, names)
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ===============================
# MAIN
# ===============================
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5050))
    print(f"\n🚀 YAMNet server running on http://localhost:{PORT}")
    load_yamnet()
    app.run(host="0.0.0.0", port=PORT, debug=True)
