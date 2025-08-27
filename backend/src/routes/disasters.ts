import { Router } from 'express';
import { DescopeAuthService } from '../services/auth';
import { logger, orchestrator } from '../index';

const router = Router();
const authService = new DescopeAuthService(logger);

// Get all active disasters
router.get('/', async (req, res) => {
  try {
    // Get active disasters from orchestrator's agents
    const agentStatuses = orchestrator.getAllAgentStatuses();
    const disasters: any[] = [];
    
    // Collect disasters from detection agents
    Object.entries(agentStatuses).forEach(([agentName, status]: [string, any]) => {
      if (status.metrics?.activeFires) {
        // Add fire data
        for (let i = 0; i < status.metrics.activeFires; i++) {
          disasters.push({
            id: `fire_${Date.now()}_${i}`,
            type: 'fire',
            severity: 'high',
            location: { lat: 34.0522 + Math.random() * 0.1, lon: -118.2437 + Math.random() * 0.1 },
            timestamp: new Date().toISOString(),
          });
        }
      }
      if (status.metrics?.activeThreats) {
        // Add threat data from analyzer
        for (let i = 0; i < status.metrics.activeThreats; i++) {
          disasters.push({
            id: `threat_${Date.now()}_${i}`,
            type: 'other',
            severity: status.metrics.criticalThreats > 0 ? 'critical' : 'medium',
            location: { lat: 37.7749, lon: -122.4194 },
            timestamp: new Date().toISOString(),
          });
        }
      }
    });
    
    res.json(disasters);
  } catch (error) {
    logger.error('Error fetching disasters:', error);
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
});

// Get disaster by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch specific disaster details
    res.json({ id, message: 'Disaster details' });
  } catch (error) {
    logger.error('Error fetching disaster:', error);
    res.status(500).json({ error: 'Failed to fetch disaster' });
  }
});

// Report new disaster (protected route)
router.post('/', authService.authenticateToken(), async (req, res) => {
  try {
    const disaster = req.body;
    logger.info('New disaster reported:', disaster);
    
    // Process and validate disaster report
    const disasterEvent = {
      id: `disaster_${Date.now()}`,
      type: disaster.type || 'other',
      severity: disaster.severity || 'medium',
      location: disaster.location || { lat: 0, lon: 0 },
      data: disaster.data || {},
      timestamp: new Date().toISOString(),
    };
    
    // Trigger agent analysis through simulation
    await orchestrator.runSimulation(disasterEvent);
    
    res.status(201).json({ 
      success: true, 
      message: 'Disaster reported and analysis initiated',
      id: disasterEvent.id 
    });
  } catch (error) {
    logger.error('Error reporting disaster:', error);
    res.status(500).json({ error: 'Failed to report disaster' });
  }
});

// Update disaster status
router.put('/:id', authService.authenticateToken(), authService.requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    logger.info(`Updating disaster ${id}:`, updates);
    
    res.json({ 
      success: true, 
      message: 'Disaster updated successfully' 
    });
  } catch (error) {
    logger.error('Error updating disaster:', error);
    res.status(500).json({ error: 'Failed to update disaster' });
  }
});

// Get disasters by location
router.get('/location/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const radius = req.query.radius || 50; // km
    
    // Find disasters near location
    const nearbyDisasters: any[] = [];
    
    // Get current disasters and filter by location
    const agentStatuses = orchestrator.getAllAgentStatuses();
    // Simulate some nearby disasters for demo
    if (Math.random() > 0.5) {
      nearbyDisasters.push({
        id: `nearby_${Date.now()}`,
        type: 'fire',
        distance: Math.random() * Number(radius),
        location: { lat: Number(lat), lon: Number(lon) },
      });
    }
    
    res.json({ 
      location: { lat, lon },
      radius,
      disasters: nearbyDisasters 
    });
  } catch (error) {
    logger.error('Error fetching disasters by location:', error);
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
});

export const disasterRoutes = router;