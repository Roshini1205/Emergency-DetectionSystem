import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Clock, Phone, CheckCircle, Volume2, Download, Play, ChevronLeft, Filter, Calendar, Search, FileText, Mic, MessageSquare, Activity, Shield } from 'lucide-react';

export default function Alert() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/audio/recent-alerts');
        const ct = res.headers.get('content-type') || '';
        const text = await res.text();
        let data = null;
        if (ct.includes('application/json') && text) {
          try { data = JSON.parse(text); } catch {}
        }
        if (res.ok && Array.isArray(data)) {
          // Transform backend data to match UI expectations
          const transformedAlerts = data.map(alert => ({
            id: alert.id,
            type: alert.type.toUpperCase(),
            severity: alert.severity,
            timestamp: new Date(alert.time).toLocaleString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            location: alert.location,
            coordinates: { lat: 0, lng: 0 }, // Add real coordinates if available
            confidence: alert.confidence,
            status: 'resolved', // Default status
            audioUrl: alert.hasAudio ? `#audio-${alert.id}` : '#',
            notificationsSent: 3,
            description: `${alert.type} detected with ${alert.confidence}% confidence`,
            duration: 'N/A',
            decibel: 'N/A'
          }));
          setAlerts(transformedAlerts);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };

    fetchAlerts();
    // Poll every 5 seconds for new alerts
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#a91d3a';
      case 'high': return '#e74c3c';
      case 'medium': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.severity !== filter) return false;
    if (searchTerm && !alert.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    today: alerts.filter(a => {
      const alertDate = new Date(a.timestamp);
      const today = new Date();
      return alertDate.toDateString() === today.toDateString();
    }).length
  };

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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">ALERTS</h1>
                <p className="text-gray-400 text-sm">Emergency Detection Logs</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg w-64 focus:outline-none focus:border-[#a91d3a]"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#a91d3a]/20 rounded-xl">
                <Activity className="w-6 h-6 text-[#a91d3a]" />
              </div>
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-gray-400 text-sm">Total Alerts</p>
            <p className="text-gray-500 text-xs mt-1">All time records</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-3xl font-bold">{stats.critical}</span>
            </div>
            <p className="text-gray-400 text-sm">Critical Alerts</p>
            <p className="text-gray-500 text-xs mt-1">Requiring immediate action</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-3xl font-bold">{stats.resolved}</span>
            </div>
            <p className="text-gray-400 text-sm">Resolved Alerts</p>
            <p className="text-gray-500 text-xs mt-1">Successfully handled</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-3xl font-bold">{stats.today}</span>
            </div>
            <p className="text-gray-400 text-sm">Today's Alerts</p>
            <p className="text-gray-500 text-xs mt-1">Current day incidents</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  filter === filterOption
                    ? 'bg-[#a91d3a] text-white shadow-lg shadow-[#a91d3a]/50'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-gray-400 text-sm">
            Showing detected audio emergency events
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              onClick={() => setSelectedAlert(alert)}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-gray-800 rounded-2xl"></div>
              
              {/* Left Border */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                style={{ backgroundColor: getSeverityColor(alert.severity) }}
              ></div>
              
              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${getSeverityColor(alert.severity)}20` }}
                      >
                        <AlertTriangle 
                          className="w-6 h-6" 
                          style={{ color: getSeverityColor(alert.severity) }}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{alert.type}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{alert.timestamp}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-800 text-gray-300">
                      {alert.confidence}% conf
                    </span>
                  </div>
                </div>

                {/* Alert Description */}
                <div className="mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed">{alert.description}</p>
                </div>

                {/* Audio Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mic className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">Duration</span>
                    </div>
                    <p className="text-white font-semibold text-lg">{alert.duration}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">Intensity</span>
                    </div>
                    <p className="text-white font-semibold text-lg">{alert.decibel}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                  <div className="flex items-center space-x-3">
                    <button 
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Play audio for alert:', alert.id);
                      }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Play Audio</span>
                    </button>
                    <button 
                      className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('View report for alert:', alert.id);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Report</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{alert.notificationsSent} contacts notified</span>
                  </div>
                </div>

                {/* Response Status */}
                <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                  alert.status === 'resolved' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-[#a91d3a]/10 text-[#a91d3a] border border-[#a91d3a]/20'
                }`}>
                  {alert.status === 'resolved' ? '✓ Alert Resolved' : '⚠ Active Alert'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-800 rounded-full animate-pulse"></div>
                <CheckCircle className="absolute inset-0 m-auto w-12 h-12 text-gray-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">No Alerts Found</h3>
            <p className="text-gray-400">No emergency events match your current filters</p>
          </div>
        )}

        {/* Footer Summary */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Logs</span>
              </button>
              <button className="px-4 py-2 bg-[#a91d3a] hover:bg-[#8a1730] rounded-lg transition-all flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="fixed bottom-6 left-6 bg-gradient-to-r from-gray-900 to-black border border-gray-800 backdrop-blur-xl rounded-xl px-6 py-3 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">System: <span className="text-green-400">ACTIVE</span></span>
          <div className="w-px h-4 bg-gray-700"></div>
          <span className="text-sm text-gray-400">Last updated: Just now</span>
          <div className="w-px h-4 bg-gray-700"></div>
          <span className="text-sm text-gray-400">ECHOGUARD v2.1</span>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Alert Details</h2>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: getSeverityColor(selectedAlert.severity) }}>
                    {selectedAlert.type}
                  </h3>
                  <p className="text-gray-300">{selectedAlert.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Timestamp</p>
                    <p className="text-white font-medium">{selectedAlert.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white font-medium">{selectedAlert.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Confidence</p>
                    <p className="text-white font-medium">{selectedAlert.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`font-medium ${selectedAlert.status === 'resolved' ? 'text-green-400' : 'text-[#a91d3a]'}`}>
                      {selectedAlert.status === 'resolved' ? 'Resolved' : 'Active'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-800">
                  <h4 className="text-lg font-bold mb-4">Actions</h4>
                  <div className="flex gap-4">
                    <button className="flex-1 px-4 py-3 bg-[#a91d3a] hover:bg-[#8a1730] rounded-xl transition-all text-white font-medium">
                      Play Audio Recording
                    </button>
                    <button className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all text-white font-medium">
                      View on Map
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}