import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, MapPin, Shield, Mic, Volume2, Mail, Phone, Plus, Save, Trash2, ChevronLeft, Settings as SettingsIcon, Activity, Lock, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // User data state
  const [userData, setUserData] = useState({
    name: 'User',
    email: 'user@example.com',
    phone: '',
    avatar: 'U'
  });

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData({
          name: user.name || 'User',
          email: user.email || 'user@example.com',
          phone: user.phone || '',
          avatar: user.name ? user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 'U'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const [contacts, setContacts] = useState([]);

  // Load emergency contacts from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch('/api/user/emergency-contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ct = res.headers.get('content-type') || '';
        const text = await res.text();
        let data = null;
        if (ct.includes('application/json') && text) {
          try { data = JSON.parse(text); } catch {}
        }
        if (!res.ok || !data) return;

        const loaded = (data.emergencyContacts || []).map((c) => ({
          id: (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now() + Math.random()),
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          role: 'Emergency Contact',
        }));
        setContacts(loaded);
      } catch (e) {
        console.error('Failed to load emergency contacts', e);
      }
    })();
  }, []);

  const saveEmergencyContacts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please sign in again.');
    }

    const payload = {
      emergencyContacts: contacts.map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
      })),
    };

    const res = await fetch('/api/user/emergency-contacts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    let data = null;
    if (ct.includes('application/json') && text) {
      try { data = JSON.parse(text); } catch {}
    }
    if (!res.ok) throw new Error((data && data.message) || `Failed to save contacts (${res.status})`);

    const normalized = (data.emergencyContacts || []).map((c) => ({
      id: (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now() + Math.random()),
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      role: 'Emergency Contact',
    }));
    setContacts(normalized);
  };

  const saveProfileInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please sign in again.');
    }

    const payload = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
    };

    const res = await fetch('/api/user/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    let data = null;
    if (ct.includes('application/json') && text) {
      try { data = JSON.parse(text); } catch {}
    }
    if (!res.ok) throw new Error((data && data.message) || `Failed to save profile (${res.status})`);

    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUserData({
        name: data.user.name || 'User',
        email: data.user.email || 'user@example.com',
        phone: data.user.phone || '',
        avatar: data.user.name
          ? data.user.name
              .split(' ')
              .map((n) => n.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'U',
      });
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveStatus('');
    try {
      if (!userData.phone?.trim()) {
        throw new Error('Phone number is required.');
      }

      const validContacts = contacts
        .map((c) => ({
          name: (c.name || '').trim(),
          email: (c.email || '').trim(),
          phone: (c.phone || '').trim(),
        }))
        .filter((c) => c.name || c.email || c.phone);

      if (validContacts.length === 0) {
        throw new Error('At least 1 emergency contact is required.');
      }

      const hasInvalid = validContacts.some((c) => !c.email || !c.phone);
      if (hasInvalid) {
        throw new Error('Emergency contact email and phone are required.');
      }

      // Save both profile + contacts so the button works on every tab.
      await saveProfileInfo();
      await saveEmergencyContacts();
      setSaveStatus('Saved.');
    } catch (e) {
      setSaveStatus(e?.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };
  const [settings, setSettings] = useState({
    audioEnabled: true,
    sensitivity: 75,
    notifications: {
      push: true,
      sms: true,
      email: true
    },
    location: true,
    autoRecord: false
  });

  const addContact = () => {
    const newContact = {
      id: Date.now(),
      name: '',
      phone: '',
      email: '',
      role: 'Emergency Contact'
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const updateContact = (id, field, value) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'contacts', label: 'Emergency Contacts', icon: Phone },
    { id: 'detection', label: 'Detection', icon: Mic },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Top Navigation */}
      <nav className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="p-2 hover:bg-gray-800 rounded-lg transition-all">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#a91d3a] to-red-700 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">SETTINGS</h1>
                <p className="text-gray-400 text-sm">System Configuration</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-4 py-2 bg-[#a91d3a] hover:bg-[#8a1730] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {saveStatus ? (
          <div className="mb-4 text-sm text-gray-300 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
            {saveStatus}
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-4 sticky top-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#a91d3a] text-white shadow-lg shadow-[#a91d3a]/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#a91d3a] to-red-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {userData.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900"></div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{userData.name}</h3>
                      <p className="text-gray-400">Security Administrator</p>
                      <p className="text-gray-500 text-sm mt-1">Level 3 Access • Last login: Today</p>
                      <button className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all">
                        Change Photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 mb-2 font-medium">Full Name</label>
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-2 font-medium">Email</label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-2 font-medium">Phone Number</label>
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 mb-2 font-medium">Organization</label>
                      <input
                        type="text"
                        defaultValue="SafeSound AI Security"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4">Access Level</h3>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-6 h-6 text-green-400" />
                          <div>
                            <p className="text-white font-medium">Level 3 Administrator</p>
                            <p className="text-gray-400 text-sm">Full system access and control</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4">Emergency Contacts</h3>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      {contacts.filter((c) => c.name || c.phone || c.email).length === 0 ? (
                        <p className="text-gray-400 text-sm">No emergency contacts saved yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {contacts
                            .filter((c) => c.name || c.phone || c.email)
                            .slice(0, 3)
                            .map((c) => (
                              <div key={c.id} className="flex items-start justify-between">
                                <div>
                                  <p className="text-white font-medium">{c.name || 'Emergency Contact'}</p>
                                  <p className="text-gray-400 text-sm">
                                    {[c.phone, c.email].filter(Boolean).join(' • ') || ''}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">Saved</span>
                              </div>
                            ))}
                          {contacts.filter((c) => c.name || c.phone || c.email).length > 3 ? (
                            <p className="text-gray-500 text-xs">+ {contacts.filter((c) => c.name || c.phone || c.email).length - 3} more</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contacts Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Emergency Contacts</h2>
                      <p className="text-gray-400">People to notify during emergencies</p>
                    </div>
                    <button
                      onClick={addContact}
                      className="px-4 py-2 bg-[#a91d3a] hover:bg-[#8a1730] text-white rounded-xl flex items-center gap-2 transition-all"
                    >
                      <Plus size={20} />
                      Add Contact
                    </button>
                  </div>

                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#a91d3a]/20 to-red-700/20 rounded-xl flex items-center justify-center">
                              <User className="w-6 h-6 text-[#a91d3a]" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{contact.name || 'New Contact'}</h3>
                              <p className="text-gray-400 text-sm">{contact.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeContact(contact.id)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-gray-300" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Contact Name</label>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                              placeholder="Full name"
                              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                              placeholder="+1 234 567 8900"
                              required
                              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-sm mb-1">Email Address</label>
                            <input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                              placeholder="email@example.com"
                              required
                              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium mb-1">Notification Priority</h4>
                        <p className="text-gray-400 text-sm">
                          Emergency contacts will be notified in order of priority during critical events.
                          Ensure contact information is up-to-date.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detection Settings Tab */}
              {activeTab === 'detection' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Detection Settings</h2>

                  <div className="space-y-6">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#a91d3a]/20 rounded-xl flex items-center justify-center">
                            <Mic className="w-6 h-6 text-[#a91d3a]" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">Audio Detection</h3>
                            <p className="text-gray-400 text-sm">Enable real-time audio monitoring</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.audioEnabled}
                            onChange={(e) => setSettings({...settings, audioEnabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#a91d3a]"></div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">Detection Sensitivity</h3>
                            <p className="text-gray-400 text-sm">Adjust audio detection sensitivity</p>
                          </div>
                        </div>
                        <span className="text-white font-bold text-lg">{settings.sensitivity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.sensitivity}
                        onChange={(e) => setSettings({...settings, sensitivity: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#a91d3a]"
                      />
                      <div className="flex justify-between text-gray-500 text-xs mt-2">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-green-500" />
                            <h3 className="text-white font-semibold">Location Tracking</h3>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.location}
                              onChange={(e) => setSettings({...settings, location: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>
                        <p className="text-gray-400 text-sm">Include precise location in alerts</p>
                      </div>

                      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-purple-500" />
                            <h3 className="text-white font-semibold">Auto Recording</h3>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.autoRecord}
                              onChange={(e) => setSettings({...settings, autoRecord: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                        <p className="text-gray-400 text-sm">Record audio during incidents</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>

                  <div className="space-y-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-[#a91d3a]" />
                          <div>
                            <h3 className="text-white font-semibold">Push Notifications</h3>
                            <p className="text-gray-400 text-sm">Instant alerts on your device</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.push}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, push: e.target.checked}
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a91d3a]"></div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-green-500" />
                          <div>
                            <h3 className="text-white font-semibold">SMS Alerts</h3>
                            <p className="text-gray-400 text-sm">Text message notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.sms}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, sms: e.target.checked}
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-blue-500" />
                          <div>
                            <h3 className="text-white font-semibold">Email Reports</h3>
                            <p className="text-gray-400 text-sm">Detailed email notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.email}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {...settings.notifications, email: e.target.checked}
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy & Security</h2>

                  <div className="space-y-4">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-6 h-6 text-green-500" />
                        <h3 className="text-white font-semibold">Data Security</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        All audio data is processed locally on your device. Only emergency event metadata is transmitted to our servers using end-to-end encryption.
                      </p>
                      <button className="text-[#a91d3a] text-sm hover:underline">View Privacy Policy</button>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                      <div className="flex items-center space-x-3 mb-4">
                        <Lock className="w-6 h-6 text-blue-500" />
                        <h3 className="text-white font-semibold">Change Password</h3>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current Password"
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#a91d3a] transition-all"
                        />
                        <button className="px-6 py-2 bg-[#a91d3a] hover:bg-[#8a1730] text-white rounded-lg transition-all">
                          Update Password
                        </button>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div>
                  <span>SafeSound AI Settings v2.1 • </span>
                  <span className="text-green-400">System Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Last saved: Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}