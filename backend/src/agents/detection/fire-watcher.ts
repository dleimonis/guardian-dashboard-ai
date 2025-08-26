import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';
import axios from 'axios';

interface FireData {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  satellite: string;
  acquisition_time: string;
  fire_power?: number;
}

export class FireWatcherAgent extends BaseAgent {
  private lastCheckTime: Date;
  private detectedFires: Map<string, FireData> = new Map();
  private apiKey: string;

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'FireWatcher',
      'Monitors NASA satellites for fire detection',
      logger,
      orchestrator
    );
    this.lastCheckTime = new Date();
    this.apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing...`);
    
    // Test API connection
    try {
      await this.testNASAConnection();
      this.logActivity('NASA FIRMS API connection established');
    } catch (error) {
      this.logger.warn(`${this.name} running in simulation mode - NASA API not available`);
    }
  }

  private async testNASAConnection(): Promise<void> {
    // NASA FIRMS API endpoint for testing
    const testUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${this.apiKey}/MODIS_NRT/world/1/2024-01-01`;
    
    try {
      const response = await axios.get(testUrl, { timeout: 5000 });
      if (response.status === 200) {
        this.logger.info('NASA FIRMS API test successful');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid NASA API key');
      }
      throw error;
    }
  }

  protected async process(): Promise<void> {
    try {
      // Check for new fire data
      const fires = await this.checkForFires();
      
      if (fires.length > 0) {
        this.logActivity(`Detected ${fires.length} active fires`);
        
        for (const fire of fires) {
          await this.analyzeAndReportFire(fire);
        }
      }

      // Update status metrics
      this.updateStatus({
        status: 'online',
        message: 'Monitoring active',
        metrics: {
          activeFires: this.detectedFires.size,
          lastCheck: this.lastCheckTime.toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Processing error',
      });
    }
  }

  private async checkForFires(): Promise<FireData[]> {
    // In production, this would call the NASA FIRMS API
    // For demo, we'll simulate fire detection
    
    if (Math.random() > 0.95) {
      // Simulate fire detection (5% chance)
      return this.simulateFireDetection();
    }
    
    return [];
  }

  private simulateFireDetection(): FireData[] {
    const locations = [
      { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
      { lat: 37.7749, lon: -122.4194, name: 'San Francisco' },
      { lat: 33.4484, lon: -112.0740, name: 'Phoenix' },
      { lat: 47.6062, lon: -122.3321, name: 'Seattle' },
      { lat: 39.7392, lon: -104.9903, name: 'Denver' },
    ];

    const location = locations[Math.floor(Math.random() * locations.length)];
    
    return [{
      latitude: location.lat + (Math.random() - 0.5) * 0.1,
      longitude: location.lon + (Math.random() - 0.5) * 0.1,
      brightness: 300 + Math.random() * 100,
      confidence: 75 + Math.random() * 25,
      satellite: 'MODIS',
      acquisition_time: new Date().toISOString(),
      fire_power: 10 + Math.random() * 50,
    }];
  }

  private async analyzeAndReportFire(fire: FireData): Promise<void> {
    const fireId = `${fire.latitude.toFixed(4)}_${fire.longitude.toFixed(4)}`;
    
    // Check if this is a new fire or update
    const isNewFire = !this.detectedFires.has(fireId);
    this.detectedFires.set(fireId, fire);

    if (isNewFire && fire.confidence > 80) {
      const severity = this.calculateSeverity(fire);
      
      const event: DisasterEvent = {
        id: `fire_${Date.now()}`,
        type: 'fire',
        severity,
        location: {
          lat: fire.latitude,
          lon: fire.longitude,
          radius: this.estimateFireRadius(fire),
        },
        data: {
          brightness: fire.brightness,
          confidence: fire.confidence,
          satellite: fire.satellite,
          firePower: fire.fire_power,
          detectionTime: fire.acquisition_time,
        },
        timestamp: new Date().toISOString(),
      };

      // Emit disaster event
      this.emit('disaster_detected', event);
      
      // Send message to threat analyzer
      this.sendMessage('ThreatAnalyzer', 'new_threat', event);
      
      this.logActivity('New fire detected and reported', {
        location: `${fire.latitude}, ${fire.longitude}`,
        severity,
      });
    }
  }

  private calculateSeverity(fire: FireData): 'low' | 'medium' | 'high' | 'critical' {
    if (fire.brightness > 400 && fire.confidence > 95) {
      return 'critical';
    } else if (fire.brightness > 350 && fire.confidence > 90) {
      return 'high';
    } else if (fire.brightness > 320 && fire.confidence > 85) {
      return 'medium';
    }
    return 'low';
  }

  private estimateFireRadius(fire: FireData): number {
    // Estimate fire radius in kilometers based on brightness
    const baseRadius = 0.5;
    const brightnessMultiplier = fire.brightness / 300;
    return baseRadius * brightnessMultiplier;
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request_status':
        this.sendMessage(message.from, 'status_response', this.getStatus());
        break;
        
      case 'check_location':
        this.checkSpecificLocation(message.data);
        break;
        
      case 'clear_fire':
        this.clearFire(message.data.fireId);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private checkSpecificLocation(location: { lat: number; lon: number; radius: number }) {
    // Check if any detected fires are within the specified area
    const nearbyFires: FireData[] = [];
    
    this.detectedFires.forEach((fire) => {
      const distance = this.calculateDistance(
        location.lat,
        location.lon,
        fire.latitude,
        fire.longitude
      );
      
      if (distance <= location.radius) {
        nearbyFires.push(fire);
      }
    });

    if (nearbyFires.length > 0) {
      this.sendMessage('ThreatAnalyzer', 'location_fires', {
        location,
        fires: nearbyFires,
      });
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for distance calculation
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

  private clearFire(fireId: string) {
    if (this.detectedFires.has(fireId)) {
      this.detectedFires.delete(fireId);
      this.logActivity('Fire cleared', { fireId });
    }
  }

  protected cleanup(): void {
    this.detectedFires.clear();
  }

  protected getProcessingInterval(): number {
    // Check for fires every 3 minutes
    return 180000;
  }
}