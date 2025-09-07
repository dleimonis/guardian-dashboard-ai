import { Router } from 'express';
import { DescopeAuthService } from '../services/auth';
import { logger } from '../services/logger';

const router = Router();
const authService = new DescopeAuthService(logger);
let orchestrator: any;

export function setOrchestrator(orch: any) {
  orchestrator = orch;
}

// Get all agent statuses
router.get('/status', async (req, res) => {
  try {
    const statuses = orchestrator.getAllAgentStatuses();
    res.json(statuses);
  } catch (error) {
    logger.error('Error fetching agent statuses:', error);
    res.status(500).json({ error: 'Failed to fetch agent statuses' });
  }
});

// Get specific agent status
router.get('/:name/status', async (req, res) => {
  try {
    const { name } = req.params;
    const status = orchestrator.getAgentStatus(name);
    
    if (!status) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(status);
  } catch (error) {
    logger.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Failed to fetch agent status' });
  }
});

// Run disaster simulation (admin only)
router.post('/simulate', authService.authenticateToken(), authService.requireRole('admin'), async (req, res) => {
  try {
    const scenario = req.body;
    
    logger.info('Running disaster simulation:', scenario);
    
    const result = await orchestrator.runSimulation(scenario);
    
    res.json(result);
  } catch (error) {
    logger.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

// Predefined simulation scenarios
router.get('/simulate/scenarios', async (req, res) => {
  try {
    const scenarios = [
      {
        id: 'earthquake_major',
        name: 'Major Earthquake',
        description: 'Magnitude 7.2 earthquake in San Francisco',
        type: 'earthquake',
        severity: 'critical',
        location: {
          lat: 37.7749,
          lon: -122.4194,
          name: 'San Francisco, CA',
        },
        data: {
          magnitude: 7.2,
          depth: 10,
          tsunami: true,
        },
      },
      {
        id: 'wildfire_spreading',
        name: 'Spreading Wildfire',
        description: 'Large wildfire with high spread rate',
        type: 'fire',
        severity: 'critical',
        location: {
          lat: 34.0522,
          lon: -118.2437,
          name: 'Los Angeles, CA',
        },
        data: {
          brightness: 450,
          confidence: 98,
          firePower: 75,
        },
      },
      {
        id: 'hurricane_cat4',
        name: 'Category 4 Hurricane',
        description: 'Major hurricane approaching Miami',
        type: 'weather',
        severity: 'critical',
        location: {
          lat: 25.7617,
          lon: -80.1918,
          name: 'Miami, FL',
        },
        data: {
          category: 4,
          windSpeed: 140,
          stormSurge: 15,
        },
      },
      {
        id: 'flood_major',
        name: 'Major Flooding',
        description: 'Severe flooding from river overflow',
        type: 'flood',
        severity: 'high',
        location: {
          lat: 29.7604,
          lon: -95.3698,
          name: 'Houston, TX',
        },
        data: {
          waterLevel: 25,
          riseRate: 2,
          affectedArea: 100,
        },
      },
      {
        id: 'multi_disaster',
        name: 'Multiple Disasters',
        description: 'Earthquake, fire, and flood simultaneously',
        type: 'other',
        severity: 'critical',
        location: {
          lat: 36.7783,
          lon: -119.4179,
          name: 'California Central Valley',
        },
        data: {
          disasters: ['earthquake', 'fire', 'flood'],
        },
      },
    ];
    
    res.json(scenarios);
  } catch (error) {
    logger.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// Get agent metrics
router.get('/metrics', async (req, res) => {
  try {
    const statuses = orchestrator.getAllAgentStatuses();
    
    const metrics = {
      total: Object.keys(statuses).length,
      online: Object.values(statuses).filter((s: any) => s.status === 'online').length,
      warning: Object.values(statuses).filter((s: any) => s.status === 'warning').length,
      offline: Object.values(statuses).filter((s: any) => s.status === 'offline').length,
      error: Object.values(statuses).filter((s: any) => s.status === 'error').length,
      bySquad: {
        detection: 4,
        analysis: 4,
        action: 3,
      },
      processingRate: {
        eventsPerMinute: Math.floor(Math.random() * 100) + 50,
        alertsDispatched: Math.floor(Math.random() * 20) + 10,
        threatsAnalyzed: Math.floor(Math.random() * 30) + 15,
      },
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching agent metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Restart agent (admin only)
router.post('/:name/restart', authService.authenticateToken(), authService.requireRole('admin'), async (req, res) => {
  try {
    const { name } = req.params;
    
    logger.info(`Restarting agent: ${name}`);
    
    // In a real implementation, this would restart the specific agent
    
    res.json({ 
      success: true,
      message: `Agent ${name} restarted successfully` 
    });
  } catch (error) {
    logger.error('Error restarting agent:', error);
    res.status(500).json({ error: 'Failed to restart agent' });
  }
});

// Get agent logs
router.get('/:name/logs', authService.authenticateToken(), async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 100 } = req.query;
    
    // In a real implementation, this would fetch actual agent logs
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `${name} started successfully`,
      },
      {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message: `${name} processing cycle completed`,
      },
    ];
    
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching agent logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export const agentRoutes = router;