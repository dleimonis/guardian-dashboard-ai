import { Router } from 'express';
import { DescopeAuthService } from '../services/auth';
import { logger } from '../services/logger';
import { userStore, User, UserLocation, UserPreferences, AlertZone, AlertHistory } from '../models/user';

const router = Router();
const authService = new DescopeAuthService(logger);

// Get all users (admin only - in production)
router.get('/all', async (req, res) => {
  try {
    // In production, check if user is admin from auth token
    const users = await userStore.getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user profile
router.get('/profile', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    
    // Get or create user
    let user = await userStore.getUserById(userId);
    if (!user) {
      // Create user from auth data
      user = await userStore.createUser({
        email: req.user?.email || 'user@guardian.ai',
        name: req.user?.name || 'Guardian User',
        phone: req.user?.phone,
        role: 'user',
        isActive: true,
      });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const updates = req.body;
    
    // Prevent role changes through this endpoint
    delete updates.role;
    delete updates.id;
    
    const updatedUser = await userStore.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user locations
router.get('/locations', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const locations = await userStore.getUserLocations(userId);
    res.json(locations);
  } catch (error) {
    logger.error('Error fetching user locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Add user location
router.post('/locations', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const locationData = {
      ...req.body,
      userId,
    };
    
    const newLocation = await userStore.addLocation(locationData);
    res.status(201).json(newLocation);
  } catch (error) {
    logger.error('Error adding user location:', error);
    res.status(500).json({ error: 'Failed to add location' });
  }
});

// Delete user location
router.delete('/locations/:id', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const { id } = req.params;
    
    const deleted = await userStore.deleteLocation(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    logger.error('Error deleting user location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Get user preferences
router.get('/preferences', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    let preferences = await userStore.getPreferences(userId);
    
    if (!preferences) {
      // Create default preferences
      preferences = await userStore.updatePreferences(userId, {});
    }
    
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.put('/preferences', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const updates = req.body;
    
    const updatedPreferences = await userStore.updatePreferences(userId, updates);
    res.json(updatedPreferences);
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user alert zones
router.get('/alert-zones', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const zones = await userStore.getUserAlertZones(userId);
    res.json(zones);
  } catch (error) {
    logger.error('Error fetching alert zones:', error);
    res.status(500).json({ error: 'Failed to fetch alert zones' });
  }
});

// Create alert zone
router.post('/alert-zones', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const zoneData = {
      ...req.body,
      userId,
    };
    
    const newZone = await userStore.createAlertZone(zoneData);
    res.status(201).json(newZone);
  } catch (error) {
    logger.error('Error creating alert zone:', error);
    res.status(500).json({ error: 'Failed to create alert zone' });
  }
});

// Update alert zone
router.put('/alert-zones/:id', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const { id } = req.params;
    const updates = req.body;
    
    // Prevent userId changes
    delete updates.userId;
    delete updates.id;
    
    const updatedZone = await userStore.updateAlertZone(userId, id, updates);
    if (!updatedZone) {
      return res.status(404).json({ error: 'Alert zone not found' });
    }
    
    res.json(updatedZone);
  } catch (error) {
    logger.error('Error updating alert zone:', error);
    res.status(500).json({ error: 'Failed to update alert zone' });
  }
});

// Delete alert zone
router.delete('/alert-zones/:id', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const { id } = req.params;
    
    const deleted = await userStore.deleteAlertZone(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Alert zone not found' });
    }
    
    res.json({ success: true, message: 'Alert zone deleted' });
  } catch (error) {
    logger.error('Error deleting alert zone:', error);
    res.status(500).json({ error: 'Failed to delete alert zone' });
  }
});

// Test alert zone with current disasters
router.post('/alert-zones/:id/test', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const { id } = req.params;
    
    const zones = await userStore.getUserAlertZones(userId);
    const zone = zones.find(z => z.id === id);
    
    if (!zone) {
      return res.status(404).json({ error: 'Alert zone not found' });
    }
    
    // Future enhancement: Check current disasters against zone polygon
    // This will integrate with the disaster monitoring service in v2
    
    res.json({
      zone,
      testResult: {
        disastersInZone: 0,
        wouldTriggerAlert: false,
        message: 'No active disasters in this zone',
      },
    });
  } catch (error) {
    logger.error('Error testing alert zone:', error);
    res.status(500).json({ error: 'Failed to test alert zone' });
  }
});

// Get user alert history
router.get('/alerts/history', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await userStore.getUserAlertHistory(userId, limit);
    res.json(history);
  } catch (error) {
    logger.error('Error fetching alert history:', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

// Acknowledge alert
router.post('/alerts/:id/acknowledge', authService.authenticateToken(), async (req: any, res) => {
  try {
    const userId = req.user?.userId || 'demo_user';
    const { id } = req.params;
    
    const acknowledged = await userStore.acknowledgeAlert(userId, id);
    if (!acknowledged) {
      return res.status(404).json({ error: 'Alert not found or already acknowledged' });
    }
    
    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

export const userRoutes = router;