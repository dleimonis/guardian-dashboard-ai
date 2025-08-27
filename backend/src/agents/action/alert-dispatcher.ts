import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from '../orchestrator';

interface Alert {
  alertId: string;
  disasterId: string;
  type: 'emergency' | 'warning' | 'watch' | 'advisory' | 'all_clear';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  location: {
    lat: number;
    lon: number;
    radius: number;
    name?: string;
  };
  affectedAreas: string[];
  instructions: string[];
  validFrom: Date;
  validUntil: Date;
  status: 'pending' | 'dispatched' | 'delivered' | 'acknowledged' | 'expired';
  dispatchChannels: string[];
  targetAudience: string[];
  acknowledgmentRate?: number;
}

interface AlertMetrics {
  totalDispatched: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number; // seconds
  acknowledgmentRate: number; // percentage
}

export class AlertDispatcherAgent extends BaseAgent {
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private alertMetrics: AlertMetrics = {
    totalDispatched: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: 0,
    acknowledgmentRate: 0,
  };
  private alertTemplates: Map<string, string> = new Map();

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'AlertDispatcher',
      'Dispatches emergency alerts and warnings',
      logger,
      orchestrator
    );
    this.initializeAlertTemplates();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing alert dispatch system...`);
    this.logActivity('Alert dispatch system online');
  }

  private initializeAlertTemplates(): void {
    this.alertTemplates.set('earthquake', 
      'EARTHQUAKE ALERT: A magnitude {magnitude} earthquake has been detected near {location}. ' +
      'Drop, Cover, and Hold On. Stay away from windows and heavy objects. ' +
      'Aftershocks are possible.');
    
    this.alertTemplates.set('fire',
      'WILDFIRE WARNING: Active fire detected in {location}. ' +
      'Evacuate immediately if in affected area. Follow designated evacuation routes. ' +
      'Close all windows and doors. Bring pets and essential items.');
    
    this.alertTemplates.set('weather',
      'SEVERE WEATHER ALERT: {weatherType} warning for {location}. ' +
      'Seek shelter immediately. Stay indoors and away from windows. ' +
      'Monitor local weather services for updates.');
    
    this.alertTemplates.set('flood',
      'FLOOD WARNING: Rising water levels detected in {location}. ' +
      'Move to higher ground immediately. Do not drive through flooded areas. ' +
      'Turn around, don\'t drown.');
    
    this.alertTemplates.set('evacuation',
      'MANDATORY EVACUATION: All residents in {location} must evacuate immediately. ' +
      'Primary route: {primaryRoute}. Alternative route: {alternativeRoute}. ' +
      'Evacuation centers are open at {shelters}.');
  }

  protected async process(): Promise<void> {
    try {
      // Process pending alerts
      this.processPendingAlerts();
      
      // Update alert statuses
      this.updateAlertStatuses();
      
      // Calculate metrics
      this.calculateMetrics();
      
      // Clean up expired alerts
      this.cleanupExpiredAlerts();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Dispatching alerts',
        metrics: {
          activeAlerts: this.activeAlerts.size,
          pendingAlerts: Array.from(this.activeAlerts.values())
            .filter(a => a.status === 'pending').length,
          dispatchedToday: this.alertMetrics.totalDispatched,
          acknowledgmentRate: this.alertMetrics.acknowledgmentRate,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Alert dispatch error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'dispatch_alert':
        this.createAndDispatchAlert(message.data);
        break;
        
      case 'priority_assignment':
        this.handlePriorityAlert(message.data);
        break;
        
      case 'evacuation_routes_ready':
        this.createEvacuationAlert(message.data);
        break;
        
      case 'execute_action':
        this.executeAction(message.data);
        break;
        
      case 'update_alert':
        this.updateAlert(message.data);
        break;
        
      case 'cancel_alert':
        this.cancelAlert(message.data.alertId);
        break;
        
      case 'request_alert_status':
        this.provideAlertStatus(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private createAndDispatchAlert(data: any): void {
    this.logger.info(`${this.name} creating alert for disaster ${data.disasterId}`);
    
    const alert: Alert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      disasterId: data.disasterId || 'unknown',
      type: this.determineAlertType(data),
      severity: data.requiresAlert ? 'critical' : 'high',
      title: this.generateAlertTitle(data),
      message: this.generateAlertMessage(data),
      location: data.location || { lat: 0, lon: 0, radius: 10 },
      affectedAreas: this.identifyAffectedAreas(data),
      instructions: this.generateInstructions(data),
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 3600000 * 6), // 6 hours validity
      status: 'pending',
      dispatchChannels: this.selectDispatchChannels(data),
      targetAudience: this.identifyTargetAudience(data),
    };
    
    // Store alert
    this.activeAlerts.set(alert.alertId, alert);
    this.alertHistory.push(alert);
    
    // Dispatch immediately if critical
    if (alert.severity === 'critical') {
      this.dispatchAlert(alert);
    }
    
    this.logActivity('Alert created', {
      alertId: alert.alertId,
      type: alert.type,
      severity: alert.severity,
    });
  }

  private determineAlertType(data: any): Alert['type'] {
    if (data.severity === 'critical' || data.threatLevel === 'critical') {
      return 'emergency';
    }
    if (data.severity === 'high' || data.threatLevel === 'high') {
      return 'warning';
    }
    if (data.severity === 'medium') {
      return 'watch';
    }
    return 'advisory';
  }

  private generateAlertTitle(data: any): string {
    const titles = {
      'earthquake': 'EARTHQUAKE ALERT',
      'fire': 'WILDFIRE WARNING',
      'weather': 'SEVERE WEATHER ALERT',
      'flood': 'FLOOD WARNING',
      'other': 'EMERGENCY ALERT',
    };
    
    const type = data.type || 'other';
    return titles[type as keyof typeof titles] || titles.other;
  }

  private generateAlertMessage(data: any): string {
    const template = this.alertTemplates.get(data.type || 'general');
    if (template) {
      return this.fillTemplate(template, data);
    }
    
    return `Emergency alert for ${data.location?.name || 'your area'}. ` +
           `${data.message || 'Take immediate protective action.'} ` +
           'Follow official instructions and monitor local news.';
  }

  private fillTemplate(template: string, data: any): string {
    let message = template;
    
    // Replace placeholders
    message = message.replace('{magnitude}', data.magnitude || 'significant');
    message = message.replace('{location}', data.location?.name || 'your area');
    message = message.replace('{weatherType}', data.weatherType || 'Severe weather');
    message = message.replace('{primaryRoute}', data.primaryRoute || 'Highway 1');
    message = message.replace('{alternativeRoute}', data.alternativeRoute || 'Highway 2');
    message = message.replace('{shelters}', data.shelters || 'designated evacuation centers');
    
    return message;
  }

  private identifyAffectedAreas(data: any): string[] {
    const areas: string[] = [];
    
    // Add primary location
    if (data.location?.name) {
      areas.push(data.location.name);
    }
    
    // Add nearby areas based on radius
    const radius = data.location?.radius || 10;
    if (radius > 50) {
      areas.push('Regional area', 'Multiple counties');
    } else if (radius > 20) {
      areas.push('City and suburbs', 'Metropolitan area');
    } else {
      areas.push('Local area', 'Immediate vicinity');
    }
    
    return areas;
  }

  private generateInstructions(data: any): string[] {
    const instructions: string[] = [];
    
    switch (data.type) {
      case 'earthquake':
        instructions.push('Drop, Cover, and Hold On');
        instructions.push('Stay away from windows and heavy objects');
        instructions.push('Do not run outside during shaking');
        instructions.push('Be prepared for aftershocks');
        break;
        
      case 'fire':
        instructions.push('Evacuate immediately if ordered');
        instructions.push('Close all windows and doors');
        instructions.push('Turn off gas and propane');
        instructions.push('Bring pets and essential items');
        break;
        
      case 'weather':
        instructions.push('Seek shelter immediately');
        instructions.push('Stay away from windows');
        instructions.push('Move to lowest floor or basement');
        instructions.push('Monitor weather radio');
        break;
        
      case 'flood':
        instructions.push('Move to higher ground');
        instructions.push('Never drive through flooded roads');
        instructions.push('Avoid walking in moving water');
        instructions.push('Turn off utilities if safe to do so');
        break;
        
      default:
        instructions.push('Follow official instructions');
        instructions.push('Stay informed via official channels');
        instructions.push('Help neighbors who may need assistance');
    }
    
    return instructions;
  }

  private selectDispatchChannels(data: any): string[] {
    const channels: string[] = [];
    
    // Select channels based on severity
    if (data.severity === 'critical' || data.threatLevel === 'critical') {
      channels.push('sms', 'push', 'email', 'radio', 'tv', 'siren');
    } else if (data.severity === 'high') {
      channels.push('sms', 'push', 'email', 'radio');
    } else {
      channels.push('push', 'email', 'web');
    }
    
    return channels;
  }

  private identifyTargetAudience(data: any): string[] {
    const audience: string[] = [];
    
    // Determine audience based on location and severity
    audience.push('residents');
    audience.push('businesses');
    
    if (data.severity === 'critical') {
      audience.push('first_responders');
      audience.push('emergency_personnel');
      audience.push('schools');
      audience.push('hospitals');
    }
    
    if (data.affectedArea?.estimatedPopulation > 10000) {
      audience.push('media');
      audience.push('government_officials');
    }
    
    return audience;
  }

  private dispatchAlert(alert: Alert): void {
    this.logger.info(`${this.name} dispatching alert ${alert.alertId}`);
    
    const startTime = Date.now();
    
    // Simulate dispatch to different channels
    for (const channel of alert.dispatchChannels) {
      this.dispatchToChannel(alert, channel);
    }
    
    // Update alert status
    alert.status = 'dispatched';
    
    // Update metrics
    this.alertMetrics.totalDispatched++;
    this.alertMetrics.averageDeliveryTime = 
      (this.alertMetrics.averageDeliveryTime + (Date.now() - startTime) / 1000) / 2;
    
    // Send to notification manager for detailed distribution
    this.sendMessage('NotificationManager', 'distribute_alert', {
      alert: alert,
      channels: alert.dispatchChannels,
      audience: alert.targetAudience,
    });
    
    // Emit action taken event
    this.emit('action_taken', {
      type: 'alert_dispatched',
      result: {
        alertId: alert.alertId,
        channels: alert.dispatchChannels,
        audienceSize: this.estimateAudienceSize(alert),
      },
    });
    
    this.logActivity('Alert dispatched', {
      alertId: alert.alertId,
      channels: alert.dispatchChannels.join(', '),
    });
  }

  private dispatchToChannel(alert: Alert, channel: string): void {
    // Simulate channel-specific dispatch
    switch (channel) {
      case 'sms':
        this.logger.debug(`SMS alert sent: ${alert.title}`);
        break;
      case 'push':
        this.logger.debug(`Push notification sent: ${alert.title}`);
        break;
      case 'email':
        this.logger.debug(`Email alert sent: ${alert.title}`);
        break;
      case 'radio':
        this.logger.debug(`Radio broadcast initiated: ${alert.title}`);
        break;
      case 'tv':
        this.logger.debug(`TV emergency broadcast: ${alert.title}`);
        break;
      case 'siren':
        this.logger.debug(`Emergency sirens activated`);
        break;
    }
  }

  private estimateAudienceSize(alert: Alert): number {
    // Estimate based on location and radius
    const basePopulation = 100000; // Simulated base population
    const radiusMultiplier = alert.location.radius / 10;
    return Math.floor(basePopulation * radiusMultiplier);
  }

  private handlePriorityAlert(data: any): void {
    // Create high-priority alert based on priority assignment
    const alertData = {
      ...data,
      severity: data.priority <= 2 ? 'critical' : 'high',
      requiresAlert: true,
    };
    
    this.createAndDispatchAlert(alertData);
  }

  private createEvacuationAlert(data: any): void {
    const alert: Alert = {
      alertId: `evac_${Date.now()}`,
      disasterId: data.disasterId,
      type: 'emergency',
      severity: 'critical',
      title: 'MANDATORY EVACUATION ORDER',
      message: this.fillTemplate(
        this.alertTemplates.get('evacuation')!,
        {
          location: data.primaryRoute?.startPoint?.name || 'affected area',
          primaryRoute: data.primaryRoute?.endPoint?.name,
          alternativeRoute: data.alternativeRoutes[0]?.endPoint?.name,
          shelters: data.primaryRoute?.endPoint?.name,
        }
      ),
      location: data.primaryRoute?.startPoint || { lat: 0, lon: 0, radius: 10 },
      affectedAreas: ['Evacuation Zone'],
      instructions: [
        'Leave immediately',
        `Primary route to ${data.primaryRoute?.endPoint?.name}`,
        'Bring essential items only',
        'Help neighbors who need assistance',
      ],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 3600000 * 12), // 12 hours
      status: 'pending',
      dispatchChannels: ['sms', 'push', 'email', 'radio', 'tv', 'siren'],
      targetAudience: ['residents', 'businesses', 'schools'],
    };
    
    this.activeAlerts.set(alert.alertId, alert);
    this.dispatchAlert(alert);
  }

  private executeAction(data: any): void {
    if (data.action?.description?.toLowerCase().includes('alert')) {
      this.createAndDispatchAlert({
        ...data,
        disasterId: data.disasterId,
        priority: data.priority,
      });
    }
  }

  private processPendingAlerts(): void {
    for (const [id, alert] of this.activeAlerts) {
      if (alert.status === 'pending') {
        const now = new Date();
        if (alert.validFrom <= now) {
          this.dispatchAlert(alert);
        }
      }
    }
  }

  private updateAlertStatuses(): void {
    for (const [id, alert] of this.activeAlerts) {
      if (alert.status === 'dispatched') {
        // Simulate delivery confirmation
        if (Math.random() > 0.1) {
          alert.status = 'delivered';
          this.alertMetrics.successfulDeliveries++;
          
          // Simulate acknowledgments
          alert.acknowledgmentRate = Math.random() * 100;
          if (alert.acknowledgmentRate > 50) {
            alert.status = 'acknowledged';
          }
        } else {
          this.alertMetrics.failedDeliveries++;
        }
      }
    }
  }

  private calculateMetrics(): void {
    const acknowledged = Array.from(this.activeAlerts.values())
      .filter(a => a.status === 'acknowledged').length;
    const total = this.activeAlerts.size;
    
    if (total > 0) {
      this.alertMetrics.acknowledgmentRate = (acknowledged / total) * 100;
    }
  }

  private cleanupExpiredAlerts(): void {
    const now = new Date();
    
    for (const [id, alert] of this.activeAlerts) {
      if (alert.validUntil < now) {
        alert.status = 'expired';
        this.activeAlerts.delete(id);
        this.logActivity('Alert expired', { alertId: id });
      }
    }
  }

  private updateAlert(data: any): void {
    const alert = this.activeAlerts.get(data.alertId);
    if (alert) {
      Object.assign(alert, data.updates);
      this.logActivity('Alert updated', { alertId: data.alertId });
      
      // Re-dispatch if needed
      if (data.updates.severity === 'critical' && alert.status === 'pending') {
        this.dispatchAlert(alert);
      }
    }
  }

  private cancelAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      // Create all-clear alert
      const allClear: Alert = {
        ...alert,
        alertId: `clear_${alertId}`,
        type: 'all_clear',
        title: 'ALL CLEAR - Emergency Ended',
        message: `The ${alert.title} has been canceled. The situation is now under control. Resume normal activities.`,
        instructions: ['Resume normal activities', 'Stay informed for updates'],
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 3600000), // 1 hour
        status: 'pending',
      };
      
      this.activeAlerts.set(allClear.alertId, allClear);
      this.dispatchAlert(allClear);
      
      // Remove original alert
      this.activeAlerts.delete(alertId);
      this.logActivity('Alert canceled', { alertId });
    }
  }

  private provideAlertStatus(requester: string, data: any): void {
    const alert = this.activeAlerts.get(data.alertId);
    if (alert) {
      this.sendMessage(requester, 'alert_status_response', alert);
    } else {
      this.sendMessage(requester, 'alert_status_response', {
        error: 'Alert not found',
        alertId: data.alertId,
      });
    }
  }

  protected cleanup(): void {
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.alertMetrics = {
      totalDispatched: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      acknowledgmentRate: 0,
    };
  }

  protected getProcessingInterval(): number {
    return 15000; // Process every 15 seconds for rapid alert dispatch
  }
}