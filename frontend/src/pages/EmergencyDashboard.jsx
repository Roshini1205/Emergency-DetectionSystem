import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, User, Bell, AlertTriangle, Activity, MapPin, Clock, Shield, ChevronDown, LogOut, UserCircle, Key, HelpCircle, Mic, MicOff } from 'lucide-react';

export default function EmergencyDashboard() {
  const navigate = useNavigate();
    // Redirect to signin if not authenticated
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
      }
    }, [navigate]);
  const [activeAlerts, setActiveAlerts] = useState(3);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef(null);
  
  // Speech recognition state
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [displayTranscripts, setDisplayTranscripts] = useState([]);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const recognitionRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [recentAlerts, setRecentAlerts] = useState([]);

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/audio/recent-alerts');
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();
        let data = null;
        if (contentType.includes('application/json') && text) {
          try { data = JSON.parse(text); } catch (e) { /* ignore parse error */ }
        }
        if (res.ok && Array.isArray(data)) {
          setRecentAlerts(data);
          setActiveAlerts(data.length);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };

    fetchAlerts();
    // Poll every 5 seconds
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active Alerts', value: '4', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', trend: '+2' },
    { label: 'Detection Rate', value: '98.5%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+0.5%' },
    { label: 'Monitored Zones', value: '12', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+3' },
    { label: 'Avg Response Time', value: '1.2s', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '-0.3s' },
  ];

  const detectionTypes = [
    { name: 'Scream', count: 24, accuracy: 98, color: 'from-red-500 to-orange-500' },
    { name: 'Cry for Help', count: 12, accuracy: 95, color: 'from-orange-500 to-yellow-500' },
    { name: 'Glass Breaking', count: 18, accuracy: 96, color: 'from-blue-500 to-cyan-500' },
    { name: 'Violence', count: 8, accuracy: 92, color: 'from-purple-500 to-pink-500' },
    { name: 'Coughing', count: 32, accuracy: 94, color: 'from-green-500 to-emerald-500' },
    { name: 'Crash', count: 15, accuracy: 97, color: 'from-indigo-500 to-purple-500' },
  ];

  // Get user data from localStorage
  const [user, setUser] = useState({
    name: 'User',
    email: 'user@example.com',
    role: 'Security Administrator',
    level: 'Level 3 Access',
    avatar: 'U'
  });

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          name: userData.name || 'User',
          email: userData.email || 'user@example.com',
          role: 'Security Administrator',
          level: 'Level 3 Access',
          avatar: userData.name ? userData.name.charAt(0).toUpperCase() : 'U'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setDisplayTranscripts((prev) => [
            ...prev,
            { text: finalTranscript.trim(), timestamp: new Date().toLocaleTimeString() },
          ]);
          setLiveTranscript("");
        } else {
          setLiveTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Audio streaming state
  const mediaRecorderRef = useRef(null);

  const sendAudioChunk = async (blob) => {
    const formData = new FormData();
    formData.append('chunk', blob, 'chunk.webm');
    
    // Get user ID from localStorage if available
    const storedUser = localStorage.getItem('user');
    let userId = null;
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Backend returns id (converted from _id)
        userId = userData.id || userData._id;
        if (userId) {
          formData.append('userId', userId);
          console.log('🔐 Sending audio chunk for user:', userId);
        } else {
          console.warn('⚠️ No userId found in localStorage');
        }
      } catch (e) {
        console.error("Error parsing user for ID", e);
      }
    } else {
      console.warn('⚠️ No user data in localStorage - please login');
    }
    
    // Add location if available (mock for now)
    formData.append('location', 'User Dashboard');

    try {
      const response = await fetch('http://localhost:4001/api/audio/stream-analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error('Stream analysis failed:', response.status, response.statusText);
        return;
      }
      
      const ct = response.headers.get('content-type') || '';
      const text = await response.text();
      
      if (!text) return; // nothing to do
      if (!ct.includes('application/json')) {
        console.warn('Non-JSON response:', text);
        return;
      }
      
      let data = null;
      try {
        data = JSON.parse(text);
        setLiveAnalysis(data);
        console.log('Analysis result:', data);
      } catch (e) {
        console.error('JSON parse error:', e);
        return;
      }
      
      // If dangerous sound detected, show alert in UI
      if (data && data.top_class) {
         // We can update the UI to show what is being detected
         console.log('Detected:', data.top_class, 'Confidence:', data.confidence);
      }

    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start MediaRecorder for audio analysis
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sendAudioChunk(event.data);
        }
      };

      // Hack: Restart recorder every 2 seconds to ensure each chunk has a valid WebM header
      // This allows the stateless backend to process each chunk independently
      mediaRecorder.start();
      
      const intervalId = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          // Small delay to allow stop to process
          setTimeout(() => {
            if (mediaRecorder.state === 'inactive') {
               mediaRecorder.start();
            }
          }, 100);
        }
      }, 2000);
      
      // Store interval ID to clear it later
      mediaRecorderRef.current.intervalId = intervalId;

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setListening(true);
        setLiveTranscript("");
      }
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Please allow microphone access to use speech recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    console.log("Running........?");
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.intervalId) {
        clearInterval(mediaRecorderRef.current.intervalId);
      }
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        // Stop all tracks to release microphone
        if (mediaRecorderRef.current.stream) {
             mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    }

    setListening(false);
    setLiveTranscript("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0b0d] to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navigation */}
      <nav className="relative z-50 bg-gradient-to-r from-black/90 to-[#0b0b0d]/90 backdrop-blur-2xl border-b border-red-900/30 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-xl blur-lg opacity-70 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-red-600 to-orange-500 p-3 rounded-xl">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      ECHOGUARD
                    </h1>
                    <span className="px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-md text-xs font-medium text-emerald-400">
                      LIVE
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Advanced Audio Emergency Detection System</p>
                </div>
              </div>
            </div>

            {/* Right Side Navigation */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/alert"
                className="relative group p-3 rounded-xl bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-gray-700 transition-all duration-300"
              >
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
              
              <Link 
                to="/settings"
                className="group p-3 rounded-xl bg-gradient-to-br from-gray-900 to-slate-900 hover:from-gray-800 hover:to-slate-800 border border-gray-800 hover:border-gray-700 transition-all duration-300"
              >
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative z-[100]" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 group p-3 rounded-xl bg-gradient-to-br from-gray-900 to-slate-900 hover:from-gray-800 hover:to-slate-800 border border-gray-800 hover:border-gray-700 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.level}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gradient-to-br from-gray-900 to-black border border-red-900/50 rounded-xl shadow-2xl overflow-hidden z-[9999] backdrop-blur-xl">  
                    {/* User Info Section */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.avatar}
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{user.name}</h3>
                          <p className="text-gray-400 text-sm">{user.role}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg inline-flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-emerald-400 text-xs font-medium">Account Active</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link 
                        to="/settings?tab=profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                      >
                        <UserCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">Profile Settings</span>
                      </Link>
                      
                      <Link 
                        to="/settings?tab=privacy"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                      >
                        <Key className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">Privacy & Security</span>
                      </Link>
                      
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-800"></div>

                    {/* Logout */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </button>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-800">
                      <p className="text-gray-500 text-xs">
                        SafeSound AI v2.4.1 • Last login: Today, 2:45 PM
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative p-6 space-y-6 max-w-7xl mx-auto">
       

        {/* Speech Recognition Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-red-900/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-lg blur opacity-70"></div>
                  <div className="relative bg-gradient-to-r from-red-600 to-red-500 p-2 rounded-lg">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Speech Recognition</h2>
                  <p className="text-gray-400 text-sm">Real-time voice transcription</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center space-x-2 ${
                listening 
                  ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-red-400'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/30 text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${listening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>{listening ? 'Listening...' : 'Inactive'}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Microphone Control */}
              <div className="flex items-center justify-center">
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`relative group/mic p-8 rounded-full transition-all duration-300 ${
                    listening
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-2xl shadow-red-500/50'
                      : 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-700'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full blur-xl opacity-70 group-hover/mic:opacity-100 transition-opacity"></div>
                  {listening ? (
                    <MicOff className="relative w-12 h-12 text-white" />
                  ) : (
                    <Mic className="relative w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              {/* Live Transcript Display */}
              {(listening || liveTranscript) && (
                <div className="bg-gradient-to-br from-red-950/30 to-black/30 border border-red-900/30 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-semibold">Live Transcript</span>
                  </div>
                  <p className="text-white text-lg min-h-[60px] italic">
                    {liveTranscript || "Speak something..."}
                  </p>
                </div>
              )}

              {/* Transcript History */}
              {displayTranscripts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Transcript History</h3>
                    <button
                      onClick={() => setDisplayTranscripts([])}
                      className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-gray-400 text-sm transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {displayTranscripts.map((transcript, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800/50 rounded-xl p-4 hover:border-gray-700/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Mic className="w-4 h-4 text-red-400" />
                            <span className="text-gray-400 text-xs">{transcript.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{transcript.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!listening && displayTranscripts.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full mb-4">
                    <Mic className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Click the microphone to start recording</p>
                  <p className="text-gray-500 text-xs">Your speech will be transcribed in real-time</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Audio Analysis */}
        {listening && liveAnalysis && (
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-blue-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-70"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Live Audio Analysis</h2>
                    <p className="text-gray-400 text-xs">Real-time YAMNet Classification</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-gray-400 text-xs mb-1">Top Detection</p>
                  <p className="text-white font-bold text-lg">{liveAnalysis.type !== 'Unknown' ? liveAnalysis.type : liveAnalysis.detections?.[0]?.class || 'None'}</p>
                  <p className={`text-sm font-medium ${liveAnalysis.emergency_detected ? 'text-red-400' : 'text-emerald-400'}`}>
                    {liveAnalysis.emergency_detected ? 'Emergency Detected' : 'Normal Audio'}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-gray-400 text-xs mb-1">Confidence</p>
                  <div className="flex items-end space-x-2">
                    <p className="text-white font-bold text-2xl">{liveAnalysis.confidence || liveAnalysis.detections?.[0]?.confidence || 0}%</p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${liveAnalysis.emergency_detected ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${liveAnalysis.confidence || liveAnalysis.detections?.[0]?.confidence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {liveAnalysis.detections && liveAnalysis.detections.length > 0 && (
                 <div className="mt-4">
                    <p className="text-gray-400 text-xs mb-2">Other Detections</p>
                    <div className="space-y-2">
                      {liveAnalysis.detections.slice(0, 3).map((det, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                           <span className="text-gray-300">{det.class}</span>
                           <span className="text-gray-500">{det.confidence}%</span>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Alert Feed */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-red-900/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg blur opacity-70"></div>
                    <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Live Alerts</h2>
                    <p className="text-gray-400 text-sm">Real-time emergency notifications</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl text-red-400 font-semibold text-sm">
                  {activeAlerts} Active
                </span>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`relative bg-gradient-to-br from-gray-900/50 to-black/50 border rounded-xl p-4 transition-all duration-300 cursor-pointer group/alert hover:shadow-lg hover:scale-[1.02] ${
                      selectedAlert?.id === alert.id 
                        ? 'border-orange-500/50 bg-orange-500/5' 
                        : 'border-gray-800/50 hover:border-gray-700/50'
                    }`}
                  >
                    {/* Alert severity indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                      alert.severity === 'high' 
                        ? 'bg-gradient-to-b from-red-500 to-orange-500' 
                        : 'bg-gradient-to-b from-yellow-500 to-amber-500'
                    }`}></div>
                    
                    <div className="pl-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                          }`} />
                          <div>
                            <span className="text-white font-semibold">{alert.type}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded text-xs font-medium text-blue-400">
                                {alert.confidence}% conf
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                alert.severity === 'high' 
                                  ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400' 
                                  : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{alert.location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-500 text-xs">
                          <span>{alert.time}</span>
                        </div>
                        <Link 
                          to="/alert"
                          className="px-3 py-1 bg-gradient-to-r from-gray-800 to-slate-800 hover:from-gray-700 hover:to-slate-700 border border-gray-700 rounded-lg text-gray-300 text-xs font-medium transition-all duration-300"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                to="/alert"
                className="w-full mt-6 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-red-950 border border-red-900/30 hover:border-red-700/50 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>View All Alerts</span>
                <div className="w-4 h-4 border-t border-r border-white rotate-45"></div>
              </Link>
            </div>
          </div>

        {/* Detection Types Grid */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-red-900/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg blur opacity-70"></div>
                  <div className="relative bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Detection Categories</h2>
                  <p className="text-gray-400 text-sm">AI-powered sound classification</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl text-red-400 font-semibold text-sm">
                6 Active Models
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {detectionTypes.map((type, index) => (
                <div 
                  key={index}
                  className="group/type relative bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800/50 rounded-xl p-5 hover:border-red-700/50 transition-all duration-300 hover:shadow-xl cursor-pointer text-center"
                >
                  {/* Hover gradient effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover/type:opacity-10 rounded-xl transition-opacity duration-500`}></div>
                  
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-full mx-auto mb-4 flex items-center justify-center group-hover/type:scale-110 transition-transform duration-500`}>
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white font-semibold text-lg mb-2">{type.name}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-bold text-white">{type.count}</span>
                        <span className="text-gray-500 text-sm">detections</span>
                      </div>
                      
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full bg-gradient-to-r ${type.color}`} style={{ width: `${type.accuracy}%` }}></div>
                      </div>
                      
                      <p className="text-gray-400 text-sm">{type.accuracy}% accuracy</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-800/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>System Status: <span className="text-emerald-400">All Systems Operational</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Last Updated: Just now</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span>SafeSound AI v2.4.1</span>
            <span className="px-3 py-1 bg-gradient-to-r from-gray-900 to-black border border-red-900/30 rounded-lg">
              © 2024 Security Systems
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
