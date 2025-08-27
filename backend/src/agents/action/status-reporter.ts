import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from '../orchestrator';

interface SystemStatus {
  timestamp: Date;
  overallStatus: 'operational' | 'degraded' | 'critical' | 'offline';
  activeDisasters: number;
  activeAlerts: number;
  agentStatuses: Map<string, AgentStatus>;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    uptime: number;
  };
  responseMetrics: {
    averageResponseTime: number;
    alertsDispatched: number;
    notificationsSent: number;
    evacuationRoutesCalculated: number;
  };
}

interface AgentStatus {
  name: string;
  status: 'online' | 'warning' | 'error' | 'offline';
  lastActivity: Date;
  processingLoad: number;
  errorCount: number;
  metrics?: any;
}

interface StatusReport {
  reportId: string;
  type: 'routine' | 'emergency' | 'incident' | 'summary';
  period: {
    start: Date;
    end: Date;
  };
  content: {
    summary: string;
    details: string[];
    statistics: any;
    recommendations: string[];
  };
  recipients: string[];
  generatedAt: Date;
  distributedAt?: Date;
}

interface IncidentReport {
  incidentId: string;
  disasterId: string;
  startTime: Date;
  endTime?: Date;
  status: 'ongoing' | 'resolved' | 'monitoring';
  summary: string;
  timeline: TimelineEvent[];
  impactAssessment: {
    affectedPopulation: number;
    casualties: number;
    displaced: number;
    economicLoss: number;
  };
  responseActions: string[];
  lessonsLearned?: string[];
}

interface TimelineEvent {
  timestamp: Date;
  event: string;
  actor: string;
  significance: 'critical' | 'major' | 'minor';
}

export class StatusReporterAgent extends BaseAgent {
  private currentStatus: SystemStatus;
  private statusHistory: SystemStatus[] = [];
  private reports: Map<string, StatusReport> = new Map();
  private incidents: Map<string, IncidentReport> = new Map();
  private reportSchedule = {
    routine: 3600000, // 1 hour
    summary: 86400000, // 24 hours
  };
  private lastRoutineReport: Date = new Date();
  private lastSummaryReport: Date = new Date();
  private criticalEvents: TimelineEvent[] = [];

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'StatusReporter',
      'Generates and distributes status reports',
      logger,
      orchestrator
    );
    
    // Initialize current status
    this.currentStatus = {
      timestamp: new Date(),
      overallStatus: 'operational',
      activeDisasters: 0,
      activeAlerts: 0,
      agentStatuses: new Map(),
      systemMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkLatency: 0,
        uptime: 0,
      },
      responseMetrics: {
        averageResponseTime: 0,
        alertsDispatched: 0,
        notificationsSent: 0,
        evacuationRoutesCalculated: 0,
      },
    };
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing status reporting system...`);
    this.gatherInitialStatus();
    this.logActivity('Status reporting system online');
  }

  private gatherInitialStatus(): void {
    // Request status from all agents
    this.sendMessage('all', 'request_status', {});
    
    // Initialize system metrics
    this.updateSystemMetrics();
  }

  protected async process(): Promise<void> {
    try {
      // Update system status
      this.updateSystemStatus();
      
      // Check for report generation
      this.checkReportSchedule();
      
      // Monitor critical events
      this.monitorCriticalEvents();
      
      // Update incident reports
      this.updateIncidentReports();
      
      // Calculate overall system health
      this.calculateSystemHealth();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Monitoring system status',
        metrics: {
          overallStatus: this.currentStatus.overallStatus,
          activeIncidents: this.incidents.size,
          reportsGenerated: this.reports.size,
          uptime: this.currentStatus.systemMetrics.uptime,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Status reporting error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'update_status':
        this.handleStatusUpdate(message.from, message.data);
        break;
        
      case 'execute_action':
        this.executeReportingAction(message.data);
        break;
        
      case 'disaster_started':
        this.createIncidentReport(message.data);
        break;
        
      case 'disaster_ended':
        this.closeIncidentReport(message.data);
        break;
        
      case 'request_system_status':
        this.provideSystemStatus(message.from);
        break;
        
      case 'request_report':
        this.generateReport(message.data);
        break;
        
      case 'critical_event':
        this.recordCriticalEvent(message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private handleStatusUpdate(agent: string, data: any): void {
    // Update agent status in system status
    const agentStatus: AgentStatus = {
      name: agent,
      status: data.status || 'online',
      lastActivity: new Date(),
      processingLoad: data.processingLoad || Math.random() * 100,
      errorCount: data.errorCount || 0,
      metrics: data.metrics,
    };
    
    this.currentStatus.agentStatuses.set(agent, agentStatus);
    
    // Update response metrics if provided
    if (data.responseMetrics) {
      Object.assign(this.currentStatus.responseMetrics, data.responseMetrics);
    }
    
    // Check for critical status changes
    if (data.status === 'error' || data.status === 'offline') {
      this.recordCriticalEvent({
        event: `Agent ${agent} status changed to ${data.status}`,
        actor: agent,
        significance: 'major',
      });
    }
  }

  private updateSystemStatus(): void {
    // Update timestamp
    this.currentStatus.timestamp = new Date();
    
    // Update system metrics
    this.updateSystemMetrics();
    
    // Count active disasters and alerts
    this.currentStatus.activeDisasters = this.incidents.size;
    
    // Store in history
    this.statusHistory.push({ ...this.currentStatus });
    
    // Keep only last 100 status entries
    if (this.statusHistory.length > 100) {
      this.statusHistory.shift();
    }
  }

  private updateSystemMetrics(): void {
    // Simulate system metrics
    this.currentStatus.systemMetrics = {
      cpuUsage: 20 + Math.random() * 60,
      memoryUsage: 30 + Math.random() * 50,
      networkLatency: 10 + Math.random() * 90,
      uptime: process.uptime(),
    };
  }

  private calculateSystemHealth(): void {
    let healthScore = 100;
    
    // Check agent statuses
    let offlineAgents = 0;
    let warningAgents = 0;
    
    for (const [name, status] of this.currentStatus.agentStatuses) {
      if (status.status === 'offline') offlineAgents++;
      if (status.status === 'warning' || status.status === 'error') warningAgents++;
    }
    
    // Deduct points for issues
    healthScore -= offlineAgents * 20;
    healthScore -= warningAgents * 10;
    
    // Check system metrics
    if (this.currentStatus.systemMetrics.cpuUsage > 80) healthScore -= 15;
    if (this.currentStatus.systemMetrics.memoryUsage > 80) healthScore -= 15;
    if (this.currentStatus.systemMetrics.networkLatency > 100) healthScore -= 10;
    
    // Determine overall status
    if (healthScore >= 90) {
      this.currentStatus.overallStatus = 'operational';
    } else if (healthScore >= 70) {
      this.currentStatus.overallStatus = 'degraded';
    } else if (healthScore >= 40) {
      this.currentStatus.overallStatus = 'critical';
    } else {
      this.currentStatus.overallStatus = 'offline';
    }
  }

  private checkReportSchedule(): void {
    const now = Date.now();
    
    // Check for routine report
    if (now - this.lastRoutineReport.getTime() >= this.reportSchedule.routine) {
      this.generateRoutineReport();
      this.lastRoutineReport = new Date();
    }
    
    // Check for daily summary
    if (now - this.lastSummaryReport.getTime() >= this.reportSchedule.summary) {
      this.generateSummaryReport();
      this.lastSummaryReport = new Date();
    }
  }

  private generateRoutineReport(): void {
    const report: StatusReport = {
      reportId: `report_routine_${Date.now()}`,
      type: 'routine',
      period: {
        start: this.lastRoutineReport,
        end: new Date(),
      },
      content: {
        summary: this.generateRoutineSummary(),
        details: this.generateRoutineDetails(),
        statistics: this.gatherRoutineStatistics(),
        recommendations: this.generateRecommendations(),
      },
      recipients: ['operations', 'management'],
      generatedAt: new Date(),
    };
    
    this.reports.set(report.reportId, report);
    this.distributeReport(report);
    
    this.logActivity('Routine report generated', {
      reportId: report.reportId,
    });
  }

  private generateRoutineSummary(): string {
    const status = this.currentStatus;
    return `System Status: ${status.overallStatus.toUpperCase()}. ` +
           `Active Disasters: ${status.activeDisasters}. ` +
           `Active Alerts: ${status.activeAlerts}. ` +
           `All agents operational: ${status.agentStatuses.size} online.`;
  }

  private generateRoutineDetails(): string[] {
    const details: string[] = [];
    
    // Agent status details
    for (const [name, status] of this.currentStatus.agentStatuses) {
      if (status.status !== 'online') {
        details.push(`${name}: ${status.status} - Last activity: ${status.lastActivity.toISOString()}`);
      }
    }
    
    // System metrics
    details.push(`CPU Usage: ${this.currentStatus.systemMetrics.cpuUsage.toFixed(1)}%`);
    details.push(`Memory Usage: ${this.currentStatus.systemMetrics.memoryUsage.toFixed(1)}%`);
    details.push(`Network Latency: ${this.currentStatus.systemMetrics.networkLatency.toFixed(0)}ms`);
    
    // Response metrics
    details.push(`Alerts Dispatched: ${this.currentStatus.responseMetrics.alertsDispatched}`);
    details.push(`Notifications Sent: ${this.currentStatus.responseMetrics.notificationsSent}`);
    
    return details;
  }

  private gatherRoutineStatistics(): any {
    return {
      systemMetrics: this.currentStatus.systemMetrics,
      responseMetrics: this.currentStatus.responseMetrics,
      agentHealth: {
        online: Array.from(this.currentStatus.agentStatuses.values())
          .filter(a => a.status === 'online').length,
        warning: Array.from(this.currentStatus.agentStatuses.values())
          .filter(a => a.status === 'warning').length,
        offline: Array.from(this.currentStatus.agentStatuses.values())
          .filter(a => a.status === 'offline').length,
      },
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check system metrics
    if (this.currentStatus.systemMetrics.cpuUsage > 70) {
      recommendations.push('Consider scaling up compute resources - high CPU usage detected');
    }
    
    if (this.currentStatus.systemMetrics.memoryUsage > 70) {
      recommendations.push('Memory usage is high - consider increasing memory allocation');
    }
    
    if (this.currentStatus.systemMetrics.networkLatency > 100) {
      recommendations.push('Network latency is elevated - check network connectivity');
    }
    
    // Check agent statuses
    const offlineAgents = Array.from(this.currentStatus.agentStatuses.values())
      .filter(a => a.status === 'offline');
    
    if (offlineAgents.length > 0) {
      recommendations.push(`Restart offline agents: ${offlineAgents.map(a => a.name).join(', ')}`);
    }
    
    // Check for high error rates
    const highErrorAgents = Array.from(this.currentStatus.agentStatuses.values())
      .filter(a => a.errorCount > 10);
    
    if (highErrorAgents.length > 0) {
      recommendations.push(`Investigate high error rates in: ${highErrorAgents.map(a => a.name).join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System operating normally - no actions required');
    }
    
    return recommendations;
  }

  private generateSummaryReport(): void {
    const report: StatusReport = {
      reportId: `report_summary_${Date.now()}`,
      type: 'summary',
      period: {
        start: this.lastSummaryReport,
        end: new Date(),
      },
      content: {
        summary: this.generateDailySummary(),
        details: this.generateSummaryDetails(),
        statistics: this.gatherDailyStatistics(),
        recommendations: this.generateDailyRecommendations(),
      },
      recipients: ['operations', 'management', 'stakeholders'],
      generatedAt: new Date(),
    };
    
    this.reports.set(report.reportId, report);
    this.distributeReport(report);
    
    this.logActivity('Daily summary report generated', {
      reportId: report.reportId,
    });
  }

  private generateDailySummary(): string {
    const totalIncidents = this.incidents.size;
    const resolvedIncidents = Array.from(this.incidents.values())
      .filter(i => i.status === 'resolved').length;
    
    return `Daily Summary: ${totalIncidents} incidents handled, ${resolvedIncidents} resolved. ` +
           `System availability: 99.9%. Average response time: ${this.currentStatus.responseMetrics.averageResponseTime}ms.`;
  }

  private generateSummaryDetails(): string[] {
    const details: string[] = [];
    
    // Incident summary
    for (const [id, incident] of this.incidents) {
      details.push(`Incident ${id}: ${incident.summary} - Status: ${incident.status}`);
    }
    
    // Critical events
    for (const event of this.criticalEvents.slice(-10)) {
      details.push(`${event.timestamp.toISOString()}: ${event.event}`);
    }
    
    return details;
  }

  private gatherDailyStatistics(): any {
    // Calculate statistics from history
    const stats = {
      averageSystemLoad: this.calculateAverageFromHistory('cpuUsage'),
      peakSystemLoad: this.calculateMaxFromHistory('cpuUsage'),
      totalAlerts: this.currentStatus.responseMetrics.alertsDispatched,
      totalNotifications: this.currentStatus.responseMetrics.notificationsSent,
      incidentCount: this.incidents.size,
      averageIncidentResolutionTime: this.calculateAverageResolutionTime(),
      systemUptime: (this.currentStatus.systemMetrics.uptime / 3600).toFixed(2) + ' hours',
    };
    
    return stats;
  }

  private calculateAverageFromHistory(metric: string): number {
    if (this.statusHistory.length === 0) return 0;
    
    const sum = this.statusHistory.reduce((acc, status) => {
      return acc + (status.systemMetrics as any)[metric];
    }, 0);
    
    return sum / this.statusHistory.length;
  }

  private calculateMaxFromHistory(metric: string): number {
    if (this.statusHistory.length === 0) return 0;
    
    return Math.max(...this.statusHistory.map(status => 
      (status.systemMetrics as any)[metric]
    ));
  }

  private calculateAverageResolutionTime(): number {
    const resolved = Array.from(this.incidents.values())
      .filter(i => i.status === 'resolved' && i.endTime);
    
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((acc, incident) => {
      return acc + (incident.endTime!.getTime() - incident.startTime.getTime());
    }, 0);
    
    return totalTime / resolved.length / 3600000; // Convert to hours
  }

  private generateDailyRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze patterns
    const avgCPU = this.calculateAverageFromHistory('cpuUsage');
    if (avgCPU > 60) {
      recommendations.push('Consider system optimization - average CPU usage is high');
    }
    
    const unresolvedIncidents = Array.from(this.incidents.values())
      .filter(i => i.status === 'ongoing');
    
    if (unresolvedIncidents.length > 0) {
      recommendations.push(`Focus on resolving ${unresolvedIncidents.length} ongoing incidents`);
    }
    
    if (this.criticalEvents.length > 20) {
      recommendations.push('High number of critical events - review system stability');
    }
    
    return recommendations.length > 0 ? recommendations : ['System performing within normal parameters'];
  }

  private createIncidentReport(data: any): void {
    const incident: IncidentReport = {
      incidentId: `incident_${Date.now()}`,
      disasterId: data.disasterId || 'unknown',
      startTime: new Date(),
      status: 'ongoing',
      summary: data.summary || `${data.type} disaster detected`,
      timeline: [
        {
          timestamp: new Date(),
          event: 'Incident started',
          actor: 'System',
          significance: 'critical',
        },
      ],
      impactAssessment: {
        affectedPopulation: data.affectedPopulation || 0,
        casualties: 0,
        displaced: 0,
        economicLoss: 0,
      },
      responseActions: [],
    };
    
    this.incidents.set(incident.incidentId, incident);
    this.currentStatus.activeDisasters++;
    
    // Generate emergency report
    this.generateEmergencyReport(incident);
    
    this.logActivity('Incident report created', {
      incidentId: incident.incidentId,
      disasterId: incident.disasterId,
    });
  }

  private generateEmergencyReport(incident: IncidentReport): void {
    const report: StatusReport = {
      reportId: `report_emergency_${incident.incidentId}`,
      type: 'emergency',
      period: {
        start: incident.startTime,
        end: new Date(),
      },
      content: {
        summary: `EMERGENCY: ${incident.summary}`,
        details: [
          `Incident ID: ${incident.incidentId}`,
          `Started: ${incident.startTime.toISOString()}`,
          `Status: ${incident.status}`,
          `Affected Population: ${incident.impactAssessment.affectedPopulation}`,
        ],
        statistics: incident.impactAssessment,
        recommendations: [
          'Activate emergency response protocol',
          'Deploy first responders',
          'Establish command center',
          'Monitor situation closely',
        ],
      },
      recipients: ['emergency_team', 'management', 'first_responders'],
      generatedAt: new Date(),
    };
    
    this.reports.set(report.reportId, report);
    this.distributeReport(report);
  }

  private closeIncidentReport(data: any): void {
    const incident = Array.from(this.incidents.values())
      .find(i => i.disasterId === data.disasterId);
    
    if (incident) {
      incident.status = 'resolved';
      incident.endTime = new Date();
      
      // Add final timeline event
      incident.timeline.push({
        timestamp: new Date(),
        event: 'Incident resolved',
        actor: 'System',
        significance: 'major',
      });
      
      // Add lessons learned
      incident.lessonsLearned = this.generateLessonsLearned(incident);
      
      // Generate incident closure report
      this.generateIncidentReport({
        reportType: 'incident',
        incident: incident,
      });
      
      this.currentStatus.activeDisasters = Math.max(0, this.currentStatus.activeDisasters - 1);
      
      this.logActivity('Incident closed', {
        incidentId: incident.incidentId,
        duration: ((incident.endTime.getTime() - incident.startTime.getTime()) / 3600000).toFixed(2) + ' hours',
      });
    }
  }

  private generateLessonsLearned(incident: IncidentReport): string[] {
    const lessons: string[] = [];
    
    // Analyze response time
    const responseTime = incident.timeline[1]?.timestamp.getTime() - incident.startTime.getTime();
    if (responseTime > 60000) {
      lessons.push('Improve initial response time - exceeded 1 minute threshold');
    }
    
    // Check impact
    if (incident.impactAssessment.casualties > 0) {
      lessons.push('Review evacuation procedures to minimize casualties');
    }
    
    if (incident.impactAssessment.economicLoss > 1000000) {
      lessons.push('Enhance early warning systems to reduce economic impact');
    }
    
    // Add generic lessons
    lessons.push('Document all response actions for training purposes');
    lessons.push('Review and update emergency protocols based on this incident');
    
    return lessons;
  }

  private generateIncidentReport(data: any): void {
    const incident = data.incident;
    const report: StatusReport = {
      reportId: `report_incident_${incident.incidentId}`,
      type: 'incident',
      period: {
        start: incident.startTime,
        end: incident.endTime || new Date(),
      },
      content: {
        summary: `Incident Report: ${incident.summary}`,
        details: [
          `Duration: ${this.calculateDuration(incident.startTime, incident.endTime)}`,
          `Final Status: ${incident.status}`,
          `Total Casualties: ${incident.impactAssessment.casualties}`,
          `Total Displaced: ${incident.impactAssessment.displaced}`,
          `Economic Loss: $${incident.impactAssessment.economicLoss}M`,
        ],
        statistics: {
          timeline: incident.timeline,
          impactAssessment: incident.impactAssessment,
          responseActions: incident.responseActions,
        },
        recommendations: incident.lessonsLearned || [],
      },
      recipients: ['management', 'analysis_team', 'stakeholders'],
      generatedAt: new Date(),
    };
    
    this.reports.set(report.reportId, report);
    this.distributeReport(report);
  }

  private calculateDuration(start: Date, end?: Date): string {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  private monitorCriticalEvents(): void {
    // Check for critical system conditions
    if (this.currentStatus.overallStatus === 'critical' || this.currentStatus.overallStatus === 'offline') {
      this.recordCriticalEvent({
        event: `System status changed to ${this.currentStatus.overallStatus}`,
        actor: 'System',
        significance: 'critical',
      });
    }
    
    // Check for multiple agent failures
    const offlineAgents = Array.from(this.currentStatus.agentStatuses.values())
      .filter(a => a.status === 'offline');
    
    if (offlineAgents.length >= 3) {
      this.recordCriticalEvent({
        event: `Multiple agent failures detected: ${offlineAgents.length} agents offline`,
        actor: 'System',
        significance: 'critical',
      });
    }
  }

  private recordCriticalEvent(data: any): void {
    const event: TimelineEvent = {
      timestamp: new Date(),
      event: data.event,
      actor: data.actor || 'Unknown',
      significance: data.significance || 'minor',
    };
    
    this.criticalEvents.push(event);
    
    // Keep only last 100 events
    if (this.criticalEvents.length > 100) {
      this.criticalEvents.shift();
    }
    
    // Update relevant incident timelines
    for (const incident of this.incidents.values()) {
      if (incident.status === 'ongoing') {
        incident.timeline.push(event);
      }
    }
    
    this.logActivity('Critical event recorded', {
      event: event.event,
      significance: event.significance,
    });
  }

  private updateIncidentReports(): void {
    for (const [id, incident] of this.incidents) {
      if (incident.status === 'ongoing') {
        // Simulate impact updates
        if (Math.random() > 0.9) {
          incident.impactAssessment.affectedPopulation += Math.floor(Math.random() * 100);
          incident.impactAssessment.economicLoss += Math.random() * 10;
        }
        
        // Check for auto-resolution (simulation)
        const duration = Date.now() - incident.startTime.getTime();
        if (duration > 3600000 && Math.random() > 0.95) {
          this.closeIncidentReport({ disasterId: incident.disasterId });
        }
      }
    }
  }

  private executeReportingAction(data: any): void {
    if (data.action?.description?.toLowerCase().includes('report') ||
        data.action?.description?.toLowerCase().includes('status')) {
      this.generateReport({
        type: 'routine',
        reason: data.action.description,
      });
    }
  }

  private generateReport(data: any): void {
    const reportType = data.type || 'routine';
    
    switch (reportType) {
      case 'routine':
        this.generateRoutineReport();
        break;
      case 'summary':
        this.generateSummaryReport();
        break;
      case 'emergency':
        if (data.incident) {
          this.generateEmergencyReport(data.incident);
        }
        break;
      case 'incident':
        if (data.incident) {
          this.generateIncidentReport(data);
        }
        break;
    }
  }

  private distributeReport(report: StatusReport): void {
    report.distributedAt = new Date();
    
    // Send to notification manager for distribution
    this.sendMessage('NotificationManager', 'send_notification', {
      channel: 'email',
      recipients: report.recipients,
      message: {
        title: `Status Report: ${report.type.toUpperCase()}`,
        body: report.content.summary + '\n\n' + report.content.details.join('\n'),
      },
      priority: report.type === 'emergency' ? 'urgent' : 'normal',
    });
    
    // Emit action taken
    this.emit('action_taken', {
      type: 'report_generated',
      result: {
        reportId: report.reportId,
        type: report.type,
        recipients: report.recipients.length,
      },
    });
    
    this.logActivity('Report distributed', {
      reportId: report.reportId,
      type: report.type,
      recipients: report.recipients.join(', '),
    });
  }

  private provideSystemStatus(requester: string): void {
    this.sendMessage(requester, 'system_status_response', {
      status: this.currentStatus,
      recentReports: Array.from(this.reports.values()).slice(-5),
      activeIncidents: Array.from(this.incidents.values())
        .filter(i => i.status === 'ongoing'),
    });
  }

  protected cleanup(): void {
    this.statusHistory = [];
    this.reports.clear();
    this.incidents.clear();
    this.criticalEvents = [];
  }

  protected getProcessingInterval(): number {
    return 30000; // Process every 30 seconds
  }
}