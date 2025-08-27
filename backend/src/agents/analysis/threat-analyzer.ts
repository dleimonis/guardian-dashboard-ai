import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';

interface ThreatAnalysis {
  threatId: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: {
    center: { lat: number; lon: number };
    radiusKm: number;
    estimatedPopulation?: number;
  };
  requiredActions: string[];
  confidence: number;
  requiresAlert: boolean;
  requiresNotification: boolean;
}

export class ThreatAnalyzerAgent extends BaseAgent {
  private activeThreats: Map<string, ThreatAnalysis> = new Map();
  private threatHistory: ThreatAnalysis[] = [];

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'ThreatAnalyzer',
      'Analyzes incoming threats and determines severity',
      logger,
      orchestrator
    );
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing threat analysis system...`);
    this.logActivity('Threat analysis system online');
  }

  protected async process(): Promise<void> {
    try {
      // Review and update active threats
      this.reviewActiveThreats();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Analyzing threats',
        metrics: {
          activeThreats: this.activeThreats.size,
          criticalThreats: Array.from(this.activeThreats.values())
            .filter(t => t.threatLevel === 'critical').length,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Analysis error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'analyze_threat':
      case 'new_threat':
        this.analyzeThreat(message.data);
        break;
        
      case 'update_threat':
        this.updateThreat(message.data);
        break;
        
      case 'clear_threat':
        this.clearThreat(message.data.threatId);
        break;
        
      case 'request_analysis':
        this.provideAnalysis(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private analyzeThreat(event: DisasterEvent): void {
    this.logger.info(`${this.name} analyzing threat:`, event.type);
    
    // Create threat analysis
    const analysis: ThreatAnalysis = {
      threatId: event.id,
      threatLevel: this.calculateThreatLevel(event),
      affectedArea: {
        center: event.location,
        radiusKm: this.calculateAffectedRadius(event),
        estimatedPopulation: this.estimateAffectedPopulation(event.location),
      },
      requiredActions: this.determineRequiredActions(event),
      confidence: this.calculateConfidence(event),
      requiresAlert: false,
      requiresNotification: false,
    };

    // Determine if alerts are needed
    if (analysis.threatLevel === 'critical' || analysis.threatLevel === 'high') {
      analysis.requiresAlert = true;
      analysis.requiresNotification = true;
    } else if (analysis.threatLevel === 'medium') {
      analysis.requiresNotification = true;
    }

    // Store analysis
    this.activeThreats.set(event.id, analysis);
    this.threatHistory.push(analysis);

    // Emit analysis complete event
    this.emit('analysis_complete', analysis);

    // Send to impact predictor
    this.sendMessage('ImpactPredictor', 'threat_analysis', analysis);

    // Send to priority manager
    this.sendMessage('PriorityManager', 'new_threat_analysis', analysis);

    this.logActivity('Threat analysis complete', {
      threatId: event.id,
      level: analysis.threatLevel,
      requiresAlert: analysis.requiresAlert,
    });
  }

  private calculateThreatLevel(event: DisasterEvent): 'low' | 'medium' | 'high' | 'critical' {
    // Base threat level on event severity
    let threatScore = 0;
    
    // Event severity contribution
    switch (event.severity) {
      case 'critical': threatScore += 40; break;
      case 'high': threatScore += 30; break;
      case 'medium': threatScore += 20; break;
      case 'low': threatScore += 10; break;
    }

    // Event type contribution
    switch (event.type) {
      case 'earthquake':
        if (event.data.magnitude > 7) threatScore += 30;
        else if (event.data.magnitude > 6) threatScore += 20;
        else if (event.data.magnitude > 5) threatScore += 10;
        break;
      case 'fire':
        if (event.data.firePower > 30) threatScore += 25;
        else if (event.data.firePower > 20) threatScore += 15;
        break;
      case 'weather':
        if (event.data.category >= 4) threatScore += 30;
        else if (event.data.category >= 3) threatScore += 20;
        break;
      case 'flood':
        if (event.data.waterLevel > 5) threatScore += 25;
        break;
    }

    // Population density contribution (simulated)
    const populationDensity = this.estimatePopulationDensity(event.location);
    if (populationDensity > 1000) threatScore += 20;
    else if (populationDensity > 500) threatScore += 10;

    // Calculate final threat level
    if (threatScore >= 70) return 'critical';
    if (threatScore >= 50) return 'high';
    if (threatScore >= 30) return 'medium';
    return 'low';
  }

  private calculateAffectedRadius(event: DisasterEvent): number {
    // Calculate affected radius based on event type and severity
    let baseRadius = event.location.radius || 5;
    
    switch (event.type) {
      case 'earthquake':
        baseRadius = (event.data.magnitude || 4) * 10;
        break;
      case 'fire':
        baseRadius = event.location.radius || 2;
        break;
      case 'weather':
        baseRadius = 50; // Storms affect larger areas
        break;
      case 'flood':
        baseRadius = 15;
        break;
    }

    // Adjust based on severity
    switch (event.severity) {
      case 'critical': return baseRadius * 2;
      case 'high': return baseRadius * 1.5;
      case 'medium': return baseRadius * 1.2;
      default: return baseRadius;
    }
  }

  private estimatePopulationDensity(location: { lat: number; lon: number }): number {
    // Simulate population density based on major city proximity
    const majorCities = [
      { lat: 34.0522, lon: -118.2437, density: 3000 }, // Los Angeles
      { lat: 40.7128, lon: -74.0060, density: 10000 }, // New York
      { lat: 41.8781, lon: -87.6298, density: 4500 }, // Chicago
      { lat: 29.7604, lon: -95.3698, density: 1500 }, // Houston
    ];

    let maxDensity = 100; // Default rural density
    
    for (const city of majorCities) {
      const distance = this.calculateDistance(
        location.lat, location.lon,
        city.lat, city.lon
      );
      
      if (distance < 50) {
        maxDensity = Math.max(maxDensity, city.density * (1 - distance / 50));
      }
    }

    return maxDensity;
  }

  private estimateAffectedPopulation(location: { lat: number; lon: number }): number {
    const density = this.estimatePopulationDensity(location);
    const areaKm2 = Math.PI * Math.pow(10, 2); // Assume 10km radius
    return Math.floor(density * areaKm2);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private determineRequiredActions(event: DisasterEvent): string[] {
    const actions: string[] = [];
    
    switch (event.type) {
      case 'earthquake':
        actions.push('Check structural integrity');
        actions.push('Monitor aftershocks');
        if (event.severity === 'critical' || event.severity === 'high') {
          actions.push('Deploy search and rescue');
          actions.push('Setup emergency shelters');
        }
        break;
        
      case 'fire':
        actions.push('Deploy firefighting resources');
        actions.push('Establish evacuation routes');
        actions.push('Monitor wind conditions');
        break;
        
      case 'weather':
        actions.push('Issue weather warnings');
        actions.push('Secure loose objects');
        if (event.data.category >= 3) {
          actions.push('Mandatory evacuation');
        }
        break;
        
      case 'flood':
        actions.push('Deploy sandbags');
        actions.push('Evacuate low-lying areas');
        actions.push('Monitor water levels');
        break;
    }

    return actions;
  }

  private calculateConfidence(event: DisasterEvent): number {
    // Calculate confidence based on data quality
    let confidence = 50;
    
    if (event.data.confidence) {
      confidence = event.data.confidence;
    } else {
      // Estimate confidence based on data completeness
      if (event.location) confidence += 20;
      if (event.data) confidence += 15;
      if (event.timestamp) confidence += 15;
    }

    return Math.min(confidence, 100);
  }

  private updateThreat(data: any): void {
    if (this.activeThreats.has(data.threatId)) {
      const threat = this.activeThreats.get(data.threatId)!;
      Object.assign(threat, data.updates);
      this.logActivity('Threat updated', { threatId: data.threatId });
    }
  }

  private clearThreat(threatId: string): void {
    if (this.activeThreats.has(threatId)) {
      this.activeThreats.delete(threatId);
      this.logActivity('Threat cleared', { threatId });
    }
  }

  private reviewActiveThreats(): void {
    const now = Date.now();
    const threatTimeout = 3600000; // 1 hour
    
    for (const [id, threat] of this.activeThreats) {
      // Remove old threats
      // In a real system, this would check actual threat status
      if (Math.random() > 0.98) {
        this.clearThreat(id);
      }
    }
  }

  private provideAnalysis(requester: string, data: any): void {
    const analysis = this.activeThreats.get(data.threatId);
    if (analysis) {
      this.sendMessage(requester, 'analysis_response', analysis);
    }
  }

  protected cleanup(): void {
    this.activeThreats.clear();
    this.threatHistory = [];
  }

  protected getProcessingInterval(): number {
    return 30000; // Process every 30 seconds
  }
}