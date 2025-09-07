import { BaseAgent, AgentMessage } from '../base-agent';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import winston from 'winston';

interface CommunityReport {
  id: string;
  type: 'fire' | 'earthquake' | 'flood' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  images: string[];
  reporterName?: string;
  reporterContact?: string;
  timestamp: Date;
  status: 'pending' | 'verified' | 'investigating' | 'resolved';
  verificationCount: number;
}

export class CommunityReporter extends BaseAgent {
  private reports: Map<string, CommunityReport> = new Map();
  private verificationThreshold = 3; // Number of verifications needed to auto-verify
  private recentReports: CommunityReport[] = [];
  private processingIntervalTime = 10000; // Check every 10 seconds

  constructor(logger?: Logger, orchestrator?: any) {
    const agentLogger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    super('CommunityReporter', 'Community incident reporting', agentLogger, orchestrator || null);
  }

  protected async initialize(): Promise<void> {
    this.logger.info('CommunityReporter agent initializing...');
    this.updateStatus({
      status: 'online',
      message: 'Monitoring community reports'
    });
  }
  
  protected async cleanup(): Promise<void> {
    this.logger.info('CommunityReporter agent cleaning up...');
    this.reports.clear();
    this.recentReports = [];
  }
  
  public getProcessingInterval(): number {
    return this.processingIntervalTime;
  }

  protected async process(): Promise<void> {
    try {
      // Process pending reports
      const pendingReports = Array.from(this.reports.values()).filter(
        report => report.status === 'pending'
      );

      for (const report of pendingReports) {
        await this.analyzeReport(report);
      }

      // Clean up old reports (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const [id, report] of this.reports.entries()) {
        if (report.timestamp < oneDayAgo && report.status === 'resolved') {
          this.reports.delete(id);
        }
      }

      this.updateStatus({
        status: 'online',
        message: `Monitoring ${this.reports.size} reports`
      });
    } catch (error) {
      this.logger.error('Error processing community reports:', error);
      this.updateStatus({
        status: 'warning',
        message: 'Error processing reports'
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'COMMUNITY_REPORT':
        this.handleNewReport(message.data as CommunityReport);
        break;
      case 'VERIFY_REPORT':
        this.verifyReport(message.data.reportId, message.data.userId);
        break;
      case 'UPDATE_REPORT_STATUS':
        this.updateReportStatus(message.data.reportId, message.data.status);
        break;
      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleNewReport(report: CommunityReport): void {
    // Assign unique ID if not present
    if (!report.id) {
      report.id = uuidv4();
    }

    // Set initial status
    report.status = 'pending';
    report.verificationCount = 0;
    report.timestamp = new Date();

    // Store report
    this.reports.set(report.id, report);
    this.recentReports.unshift(report);
    this.recentReports = this.recentReports.slice(0, 100); // Keep last 100

    this.logger.info(`New community report received: ${report.title}`);

    // Immediately analyze if it's critical
    if (report.severity === 'critical') {
      this.analyzeReport(report);
    }
  }

  private async analyzeReport(report: CommunityReport): Promise<void> {
    try {
      // Check for similar reports in the area (within 1km radius)
      const nearbyReports = this.findNearbyReports(report.location, 1);
      
      if (nearbyReports.length > 0) {
        // Multiple reports in same area - increase confidence
        report.verificationCount += nearbyReports.length;
        this.logger.info(`Found ${nearbyReports.length} similar reports nearby`);
      }

      // Auto-verify if enough verifications or critical severity
      if (report.verificationCount >= this.verificationThreshold || 
          report.severity === 'critical') {
        report.status = 'verified';
        
        // Convert to disaster event and emit
        const disasterEvent = this.convertToDisasterEvent(report);
        
        this.emit('disaster_detected', disasterEvent);
        this.emit('message', {
          from: this.name,
          to: 'Orchestrator',
          type: 'DISASTER_DETECTED',
          data: disasterEvent,
          timestamp: new Date().toISOString()
        });

        this.logger.info(`Community report verified and escalated: ${report.title}`);
      }

      // Update report in storage
      this.reports.set(report.id, report);
    } catch (error) {
      this.logger.error(`Error analyzing report ${report.id}:`, error);
    }
  }

  private findNearbyReports(location: { lat: number; lng: number }, radiusKm: number): CommunityReport[] {
    return Array.from(this.reports.values()).filter(report => {
      if (report.status !== 'pending' && report.status !== 'verified') return false;
      
      const distance = this.calculateDistance(
        location.lat, location.lng,
        report.location.lat, report.location.lng
      );
      
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for distance between two points
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private convertToDisasterEvent(report: CommunityReport): any {
    const severityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    };

    return {
      id: report.id,
      type: report.type === 'other' ? 'unknown' : report.type,
      severity: severityMap[report.severity],
      location: {
        lat: report.location.lat,
        lon: report.location.lng,
        radius: 5 // Default 5km radius for community reports
      },
      data: {
        title: report.title,
        description: report.description,
        source: 'community',
        reporter: report.reporterName || 'Anonymous',
        images: report.images,
        verificationCount: report.verificationCount,
        address: report.location.address
      },
      timestamp: report.timestamp.toISOString(),
      source: 'CommunityReporter'
    };
  }

  private verifyReport(reportId: string, userId: string): void {
    const report = this.reports.get(reportId);
    if (!report) {
      this.logger.warn(`Report ${reportId} not found for verification`);
      return;
    }

    // Increment verification count
    report.verificationCount++;
    this.logger.info(`Report ${reportId} verified by user ${userId}. Count: ${report.verificationCount}`);

    // Check if report should be auto-verified
    if (report.verificationCount >= this.verificationThreshold) {
      report.status = 'verified';
      this.analyzeReport(report);
    }

    this.reports.set(reportId, report);
  }

  private updateReportStatus(reportId: string, status: CommunityReport['status']): void {
    const report = this.reports.get(reportId);
    if (!report) {
      this.logger.warn(`Report ${reportId} not found for status update`);
      return;
    }

    report.status = status;
    this.reports.set(reportId, report);
    this.logger.info(`Report ${reportId} status updated to ${status}`);
  }

  // Public methods for API access
  public addReport(report: CommunityReport): void {
    this.handleNewReport(report);
  }

  public getReports(): CommunityReport[] {
    return Array.from(this.reports.values());
  }

  public getRecentReports(limit: number = 10): CommunityReport[] {
    return this.recentReports.slice(0, limit);
  }

  public getReportById(id: string): CommunityReport | undefined {
    return this.reports.get(id);
  }

  // Simulation method for testing
  public async simulateCommunityReport(): Promise<void> {
    const mockReport: CommunityReport = {
      id: uuidv4(),
      type: 'fire',
      severity: 'high',
      title: 'Large smoke plume spotted near residential area',
      description: 'Heavy black smoke rising from what appears to be a structure fire. Multiple buildings may be affected.',
      location: {
        lat: 34.0522 + (Math.random() - 0.5) * 0.1,
        lng: -118.2437 + (Math.random() - 0.5) * 0.1,
        address: 'Los Angeles, CA'
      },
      images: [],
      reporterName: 'Community Member',
      timestamp: new Date(),
      status: 'pending',
      verificationCount: 0
    };

    this.handleNewReport(mockReport);
    
    // Simulate verifications after 2 seconds
    setTimeout(() => {
      this.verifyReport(mockReport.id, 'user1');
      this.verifyReport(mockReport.id, 'user2');
      this.verifyReport(mockReport.id, 'user3');
    }, 2000);
  }
}

export default CommunityReporter;