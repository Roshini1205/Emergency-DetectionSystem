const Alert = require('../models/Alert');

// Get all alerts
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity, limit, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity) {
      query.severity = severity;
    }

    // Pagination
    const limitNum = limit ? parseInt(limit) : 50;
    const skip = (parseInt(page) - 1) * limitNum;

    // Fetch alerts
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .populate('resolvedBy', 'name email');

    // Get counts
    const totalCount = await Alert.countDocuments(query);
    const activeCount = await Alert.countDocuments({ status: 'active' });

    // Format response to match frontend expectations
    const formattedAlerts = alerts.map(alert => ({
      id: alert._id,
      type: alert.type,
      location: alert.location,
      severity: alert.severity,
      confidence: alert.confidence,
      status: alert.status,
      timestamp: alert.createdAt,
      time: getTimeAgo(alert.createdAt),
      resolved: alert.status === 'resolved',
      audioUrl: `/audio/${alert._id}.wav`,
      transcript: alert.transcript,
      resolvedAt: alert.resolvedAt,
      resolvedBy: alert.resolvedBy
    }));

    res.json({
      success: true,
      alerts: formattedAlerts,
      count: formattedAlerts.length,
      totalCount,
      activeCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message 
    });
  }
};

// Get single alert by ID
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id)
      .populate('resolvedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ 
        success: false,
        error: 'Alert not found' 
      });
    }

    // Format response
    const formattedAlert = {
      id: alert._id,
      type: alert.type,
      location: alert.location,
      severity: alert.severity,
      confidence: alert.confidence,
      status: alert.status,
      timestamp: alert.createdAt,
      time: getTimeAgo(alert.createdAt),
      resolved: alert.status === 'resolved',
      audioUrl: `/audio/${alert._id}.wav`,
      transcript: alert.transcript,
      resolvedAt: alert.resolvedAt,
      resolvedBy: alert.resolvedBy
    };

    res.json({
      success: true,
      alert: formattedAlert
    });
  } catch (error) {
    console.error('Get alert by ID error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch alert',
      message: error.message 
    });
  }
};

// Create new alert
exports.createAlert = async (req, res) => {
  try {
    const { type, location, severity, confidence, transcript } = req.body;

    // Validation
    if (!type || !location) {
      return res.status(400).json({ 
        success: false,
        error: 'Type and location are required' 
      });
    }

    // Create new alert
    const alert = new Alert({
      type,
      location,
      severity: severity || 'medium',
      confidence: confidence || 90,
      transcript,
      status: 'active'
    });

    await alert.save();

    // Format response
    const formattedAlert = {
      id: alert._id,
      type: alert.type,
      location: alert.location,
      severity: alert.severity,
      confidence: alert.confidence,
      status: alert.status,
      timestamp: alert.createdAt,
      time: getTimeAgo(alert.createdAt),
      resolved: false,
      audioUrl: `/audio/${alert._id}.wav`,
      transcript: alert.transcript
    };

    res.status(201).json({
      success: true,
      alert: formattedAlert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create alert',
      message: error.message 
    });
  }
};

// Update alert (resolve, dismiss, etc.)
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transcript } = req.body;

    const alert = await Alert.findById(id);

    if (!alert) {
      return res.status(404).json({ 
        success: false,
        error: 'Alert not found' 
      });
    }

    // Update fields
    if (status) {
      alert.status = status;
      if (status === 'resolved') {
        alert.resolvedAt = new Date();
        alert.resolvedBy = req.user.id; // From auth middleware
      }
    }

    if (transcript) {
      alert.transcript = transcript;
    }

    await alert.save();

    // Populate and format response
    await alert.populate('resolvedBy', 'name email');

    const formattedAlert = {
      id: alert._id,
      type: alert.type,
      location: alert.location,
      severity: alert.severity,
      confidence: alert.confidence,
      status: alert.status,
      timestamp: alert.createdAt,
      time: getTimeAgo(alert.createdAt),
      resolved: alert.status === 'resolved',
      audioUrl: `/audio/${alert._id}.wav`,
      transcript: alert.transcript,
      resolvedAt: alert.resolvedAt,
      resolvedBy: alert.resolvedBy
    };

    res.json({
      success: true,
      alert: formattedAlert,
      message: 'Alert updated successfully'
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update alert',
      message: error.message 
    });
  }
};

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
      return res.status(404).json({ 
        success: false,
        error: 'Alert not found' 
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete alert',
      message: error.message 
    });
  }
};

// Get alert statistics
exports.getAlertStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get counts by status
    const activeAlerts = await Alert.countDocuments({ 
      status: 'active',
      ...dateFilter 
    });
    
    const resolvedAlerts = await Alert.countDocuments({ 
      status: 'resolved',
      ...dateFilter 
    });

    // Get counts by severity
    const highSeverity = await Alert.countDocuments({ 
      severity: 'high',
      ...dateFilter 
    });
    
    const mediumSeverity = await Alert.countDocuments({ 
      severity: 'medium',
      ...dateFilter 
    });
    
    const lowSeverity = await Alert.countDocuments({ 
      severity: 'low',
      ...dateFilter 
    });

    // Get alerts by type
    const alertsByType = await Alert.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: '$type', 
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate average response time (time to resolve)
    const resolvedAlertsWithTime = await Alert.find({
      status: 'resolved',
      resolvedAt: { $exists: true },
      ...dateFilter
    });

    let avgResponseTime = 0;
    if (resolvedAlertsWithTime.length > 0) {
      const totalTime = resolvedAlertsWithTime.reduce((sum, alert) => {
        return sum + (alert.resolvedAt - alert.createdAt);
      }, 0);
      avgResponseTime = (totalTime / resolvedAlertsWithTime.length / 1000).toFixed(1); // in seconds
    }

    // Get recent alerts trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const alertTrend = await Alert.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        activeAlerts,
        resolvedAlerts,
        totalAlerts: activeAlerts + resolvedAlerts,
        highSeverity,
        mediumSeverity,
        lowSeverity,
        alertsByType: alertsByType.map(item => ({
          type: item._id,
          count: item.count,
          avgConfidence: Math.round(item.avgConfidence)
        })),
        avgResponseTime: `${avgResponseTime}s`,
        alertTrend: alertTrend.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message 
    });
  }
};

// Bulk update alerts (resolve multiple)
exports.bulkUpdateAlerts = async (req, res) => {
  try {
    const { alertIds, status } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Alert IDs array is required' 
      });
    }

    const updateData = { status };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user.id;
    }

    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} alerts updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update alerts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update alerts',
      message: error.message 
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

module.exports = exports;