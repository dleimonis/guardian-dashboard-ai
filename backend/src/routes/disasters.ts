import { Router } from 'express';
import { DescopeAuthService } from '../services/auth';
import { logger } from '../index';

const router = Router();
const authService = new DescopeAuthService(logger);

// Get all active disasters
router.get('/', async (req, res) => {
  try {
    // This would fetch from a database or aggregated data
    const disasters = {
      fires: [],
      earthquakes: [],
      weather: [],
      floods: [],
    };
    
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
    // Trigger agent analysis
    
    res.status(201).json({ 
      success: true, 
      message: 'Disaster reported successfully',
      id: `disaster_${Date.now()}` 
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
    const nearbyDisasters = [];
    
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