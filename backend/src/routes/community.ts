import { Router, Request, Response } from 'express';
import winston from 'winston';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Store for community reports (in-memory for demo)
const communityReports: any[] = [];

// Get all community reports
router.get('/reports', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      reports: communityReports,
      count: communityReports.length
    });
  } catch (error) {
    logger.error('Error fetching community reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community reports'
    });
  }
});

// Submit a new community report
router.post('/reports', (req: Request, res: Response) => {
  try {
    const report = req.body;
    
    // Validate required fields
    if (!report.title || !report.description || !report.location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Add metadata
    report.id = report.id || Date.now().toString();
    report.timestamp = new Date().toISOString();
    report.status = report.status || 'pending';
    report.verificationCount = report.verificationCount || 0;

    // Store report
    communityReports.unshift(report);
    
    // Keep only last 100 reports
    if (communityReports.length > 100) {
      communityReports.pop();
    }

    // Forward to CommunityReporter agent
    const orchestrator = (req as any).app.locals.orchestrator;
    if (orchestrator) {
      const communityReporter = orchestrator.getAgent('CommunityReporter');
      if (communityReporter) {
        communityReporter.addReport(report);
      }
    }

    logger.info(`Community report submitted: ${report.title}`);

    res.json({
      success: true,
      report: report,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting community report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    });
  }
});

// Verify a community report
router.post('/reports/:id/verify', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const report = communityReports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Increment verification count
    report.verificationCount = (report.verificationCount || 0) + 1;
    
    // Auto-verify if threshold reached
    if (report.verificationCount >= 3) {
      report.status = 'verified';
    }

    // Forward to CommunityReporter agent
    const orchestrator = (req as any).app.locals.orchestrator;
    if (orchestrator) {
      orchestrator.sendMessage({
        from: 'API',
        to: 'CommunityReporter',
        type: 'VERIFY_REPORT',
        data: { reportId: id, userId: userId || 'anonymous' },
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Report ${id} verified. Count: ${report.verificationCount}`);

    res.json({
      success: true,
      report: report,
      message: 'Report verified successfully'
    });
  } catch (error) {
    logger.error('Error verifying community report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify report'
    });
  }
});

// Update report status
router.patch('/reports/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const report = communityReports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'verified', 'investigating', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    report.status = status;

    // Forward to CommunityReporter agent
    const orchestrator = (req as any).app.locals.orchestrator;
    if (orchestrator) {
      orchestrator.sendMessage({
        from: 'API',
        to: 'CommunityReporter',
        type: 'UPDATE_REPORT_STATUS',
        data: { reportId: id, status },
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Report ${id} status updated to ${status}`);

    res.json({
      success: true,
      report: report,
      message: 'Status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

export default router;