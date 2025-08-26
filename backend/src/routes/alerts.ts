import { Router } from 'express';
import { DescopeAuthService, AuthenticatedRequest } from '../services/auth';
import { logger, wsManager } from '../index';

const router = Router();
const authService = new DescopeAuthService(logger);

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { severity, status, limit = 50 } = req.query;
    
    // This would fetch from a database
    const alerts = [
      {
        id: 'alert_1',
        title: 'Wildfire Alert',
        description: 'Active wildfire detected',
        severity: 'critical',
        location: 'Los Angeles, CA',
        timestamp: new Date().toISOString(),
        status: 'active',
      },
    ];
    
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
    const stats = {
      total: 150,
      active: 5,
      critical: 2,
      acknowledged: 45,
      dismissed: 100,
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