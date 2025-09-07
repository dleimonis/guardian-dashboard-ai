import { Router } from 'express';
import { logger } from '../services/logger';

const router = Router();
let orchestrator: any;

// Store historical data in memory (in production, use database)
const historicalData: any[] = [];
const MAX_HISTORY = 10000;

export function setOrchestrator(orch: any) {
  orchestrator = orch;
}

// Store disaster event for analytics
export function recordDisasterEvent(disaster: any) {
  historicalData.push({
    ...disaster,
    recordedAt: new Date().toISOString(),
  });
  
  // Keep only recent data
  if (historicalData.length > MAX_HISTORY) {
    historicalData.shift();
  }
}

// Get analytics summary
router.get('/summary', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time window
    const now = new Date();
    let hoursBack = 24;
    
    switch (timeRange) {
      case '1h':
        hoursBack = 1;
        break;
      case '24h':
        hoursBack = 24;
        break;
      case '7d':
        hoursBack = 24 * 7;
        break;
      case '30d':
        hoursBack = 24 * 30;
        break;
    }
    
    const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    
    // Filter historical data
    const recentEvents = historicalData.filter(event => 
      new Date(event.timestamp) >= cutoffTime
    );
    
    // Calculate statistics
    const stats = {
      totalDisasters: recentEvents.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      avgResponseTime: 0,
      peakHour: '',
      affectedAreas: new Set(),
    };
    
    // Aggregate data
    recentEvents.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      
      // Track affected areas
      if (event.location) {
        stats.affectedAreas.add(`${Math.round(event.location.lat)},${Math.round(event.location.lon)}`);
      }
    });
    
    // Get current agent statistics
    const agentStats = orchestrator?.getAllAgentStatuses() || {};
    
    res.json({
      timeRange,
      summary: {
        ...stats,
        affectedAreas: stats.affectedAreas.size,
      },
      agentActivity: Object.keys(agentStats).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating analytics summary:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Get temporal trends
router.get('/trends', async (req, res) => {
  try {
    const { timeRange = '24h', interval = 'hour' } = req.query;
    
    // Calculate time window
    const now = new Date();
    let hoursBack = 24;
    
    switch (timeRange) {
      case '1h':
        hoursBack = 1;
        break;
      case '24h':
        hoursBack = 24;
        break;
      case '7d':
        hoursBack = 24 * 7;
        break;
      case '30d':
        hoursBack = 24 * 30;
        break;
    }
    
    const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    
    // Filter and group data by time interval
    const trends: any[] = [];
    const intervalMs = interval === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    for (let time = cutoffTime.getTime(); time <= now.getTime(); time += intervalMs) {
      const intervalStart = new Date(time);
      const intervalEnd = new Date(time + intervalMs);
      
      const eventsInInterval = historicalData.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime >= intervalStart && eventTime < intervalEnd;
      });
      
      trends.push({
        time: intervalStart.toISOString(),
        count: eventsInInterval.length,
        critical: eventsInInterval.filter(e => e.severity === 'critical').length,
        high: eventsInInterval.filter(e => e.severity === 'high').length,
        medium: eventsInInterval.filter(e => e.severity === 'medium').length,
        low: eventsInInterval.filter(e => e.severity === 'low').length,
      });
    }
    
    res.json({
      timeRange,
      interval,
      trends,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating trends:', error);
    res.status(500).json({ error: 'Failed to generate trends' });
  }
});

// Get disaster type breakdown
router.get('/types', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time window
    const now = new Date();
    let hoursBack = 24;
    
    switch (timeRange) {
      case '1h':
        hoursBack = 1;
        break;
      case '24h':
        hoursBack = 24;
        break;
      case '7d':
        hoursBack = 24 * 7;
        break;
      case '30d':
        hoursBack = 24 * 30;
        break;
    }
    
    const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    
    // Filter historical data
    const recentEvents = historicalData.filter(event => 
      new Date(event.timestamp) >= cutoffTime
    );
    
    // Count by type with additional details
    const typeStats: Record<string, any> = {};
    
    recentEvents.forEach(event => {
      if (!typeStats[event.type]) {
        typeStats[event.type] = {
          count: 0,
          severities: { critical: 0, high: 0, medium: 0, low: 0 },
          locations: new Set(),
        };
      }
      
      typeStats[event.type].count++;
      typeStats[event.type].severities[event.severity]++;
      
      if (event.location) {
        typeStats[event.type].locations.add(
          `${Math.round(event.location.lat)},${Math.round(event.location.lon)}`
        );
      }
    });
    
    // Convert to array format
    const types = Object.entries(typeStats).map(([type, stats]) => ({
      type,
      count: stats.count,
      percentage: Math.round((stats.count / recentEvents.length) * 100) || 0,
      severities: stats.severities,
      affectedAreas: stats.locations.size,
    }));
    
    res.json({
      timeRange,
      types: types.sort((a, b) => b.count - a.count),
      total: recentEvents.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error generating type breakdown:', error);
    res.status(500).json({ error: 'Failed to generate type breakdown' });
  }
});

// Get real-time statistics
router.get('/realtime', async (req, res) => {
  try {
    // Get current active disasters from agents
    const agentStatuses = orchestrator?.getAllAgentStatuses() || {};
    
    // Calculate real-time metrics
    const realtime = {
      activeDisasters: 0,
      activeAlerts: 0,
      onlineAgents: 0,
      warningAgents: 0,
      criticalEvents: 0,
    };
    
    Object.values(agentStatuses).forEach((status: any) => {
      if (status.status === 'online') realtime.onlineAgents++;
      if (status.status === 'warning') realtime.warningAgents++;
      
      if (status.metrics) {
        realtime.activeDisasters += status.metrics.activeThreats || 0;
        realtime.activeAlerts += status.metrics.activeAlerts || 0;
        realtime.criticalEvents += status.metrics.criticalThreats || 0;
      }
    });
    
    // Get last hour activity
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentActivity = historicalData.filter(event => 
      new Date(event.timestamp) >= lastHour
    );
    
    res.json({
      realtime,
      lastHourActivity: recentActivity.length,
      agentCount: Object.keys(agentStatuses).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting real-time statistics:', error);
    res.status(500).json({ error: 'Failed to get real-time statistics' });
  }
});

export const analyticsRoutes = router;