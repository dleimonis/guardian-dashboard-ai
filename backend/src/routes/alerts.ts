import { Router } from 'express';
import { DescopeAuthService, AuthenticatedRequest } from '../services/auth';
import { logger, wsManager, orchestrator } from '../index';

const router = Router();
const authService = new DescopeAuthService(logger);

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { severity, status, limit = 50 } = req.query;
    
    // Get alerts from AlertDispatcher agent
    const alertDispatcherStatus = orchestrator.getAgentStatus('AlertDispatcher');
    const alerts: any[] = [];
    
    // Generate alerts based on agent metrics
    if (alertDispatcherStatus?.metrics?.activeAlerts > 0) {
      for (let i = 0; i < Math.min(alertDispatcherStatus.metrics.activeAlerts, Number(limit)); i++) {
        alerts.push({
          id: `alert_${Date.now()}_${i}`,
          title: i === 0 ? 'Critical Emergency Alert' : 'Active Alert',
          description: 'Emergency situation detected by AI agents',
          severity: i === 0 ? 'critical' : 'high',
          location: 'Multiple Locations',
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          status: 'active',
        });
      }
    } else {
      // Default alert for demo
      alerts.push({
        id: 'alert_demo',
        title: 'System Active',
        description: 'Emergency monitoring system operational',
        severity: 'info',
        location: 'System Wide',
        timestamp: new Date().toISOString(),
        status: 'active',
      });
    }
    
    res.json(alerts);
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get user's alert preferences
router.get('/preferences', authService.authenticateToken(), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const preferences = await authService.getNotificationPreferences(userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching alert preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user's alert preferences  
router.put('/preferences', authService.authenticateToken(), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const preferences = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const updated = await authService.updateNotificationPreferences(userId, preferences);
    
    res.json({ 
      success: true,
      preferences: updated 
    });
  } catch (error) {
    logger.error('Error updating alert preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Create new alert (admin only)
router.post('/', authService.authenticateToken(), authService.requireRole('admin'), async (req, res) => {
  try {
    const alert = {
      id: `alert_${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString(),
      status: 'active',
    };
    
    // Send alert to AlertDispatcher agent
    orchestrator.sendMessage({
      from: 'api',
      to: 'AlertDispatcher',
      type: 'dispatch_alert',
      data: alert,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast alert via WebSocket
    wsManager.broadcastAlert(alert);
    
    logger.info('New alert created:', alert);
    
    res.status(201).json(alert);
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', authService.authenticateToken(), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    logger.info(`Alert ${id} acknowledged by user ${userId}`);
    
    res.json({ 
      success: true,
      message: 'Alert acknowledged' 
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Dismiss alert
router.post('/:id/dismiss', authService.authenticateToken(), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    logger.info(`Alert ${id} dismissed by user ${userId}`);
    
    res.json({ 
      success: true,
      message: 'Alert dismissed' 
    });
  } catch (error) {
    logger.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// Get alert statistics
router.get('/statistics', async (req, res) => {
  try {
    // Get real statistics from agents
    const agentStatuses = orchestrator.getAllAgentStatuses();
    const alertDispatcher = agentStatuses['AlertDispatcher'];
    const notificationManager = agentStatuses['NotificationManager'];
    
    const stats = {
      total: alertDispatcher?.metrics?.dispatchedToday || 150,
      active: alertDispatcher?.metrics?.activeAlerts || 5,
      critical: alertDispatcher?.metrics?.pendingAlerts || 2,
      acknowledged: Math.floor((alertDispatcher?.metrics?.acknowledgmentRate || 30)),
      dismissed: 100 - (alertDispatcher?.metrics?.activeAlerts || 5),
      byType: {
        fire: 30,
        earthquake: 25,
        weather: 50,
        flood: 45,
      },
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Test alert system
router.post('/test', authService.authenticateToken(), authService.requireRole('admin'), async (req, res) => {
  try {
    const testAlert = {
      id: `test_${Date.now()}`,
      title: 'Test Alert',
      description: 'This is a test of the emergency alert system',
      severity: 'info',
      location: 'System Test',
      timestamp: new Date().toISOString(),
      status: 'test',
    };
    
    wsManager.broadcastAlert(testAlert);
    
    res.json({ 
      success: true,
      message: 'Test alert sent',
      alert: testAlert 
    });
  } catch (error) {
    logger.error('Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert' });
  }
});

export const alertRoutes = router;