import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';
import axios from 'axios';

interface QuakeData {
  id: string;
  magnitude: number;
  location: {
    latitude: number;
    longitude: number;
    depth: number;
    place?: string;
  };
  time: string;
  tsunami?: boolean;
  alert?: string;
}

export class QuakeDetectorAgent extends BaseAgent {
  private lastCheckTime: Date;
  private detectedQuakes: Map<string, QuakeData> = new Map();
  private minMagnitude: number;
  private usgsApiUrl: string;

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'QuakeDetector',
      'Monitors global seismic activity from USGS',
      logger,
      orchestrator
    );
    this.lastCheckTime = new Date();
    this.minMagnitude = parseFloat(process.env.EARTHQUAKE_MIN_MAGNITUDE || '4.0');
    this.usgsApiUrl = process.env.USGS_API_URL || 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing...`);
    
    try {
      await this.testUSGSConnection();
      this.logActivity('USGS API connection established');
    } catch (error) {
      this.logger.warn(`${this.name} running in simulation mode - USGS API not available`);
    }
  }

  private async testUSGSConnection(): Promise<void> {
    const testUrl = `${this.usgsApiUrl}/all_hour.geojson`;
    
    try {
      const response = await axios.get(testUrl, { timeout: 5000 });
      if (response.status === 200) {
        this.logger.info('USGS API test successful');
      }
    } catch (error) {
      throw new Error('USGS API connection failed');
    }
  }

  protected async process(): Promise<void> {
    try {
      const quakes = await this.checkForEarthquakes();
      
      if (quakes.length > 0) {
        this.logActivity(`Detected ${quakes.length} earthquakes above magnitude ${this.minMagnitude}`);
        
        for (const quake of quakes) {
          await this.analyzeAndReportQuake(quake);
        }
      }

      this.updateStatus({
        status: 'online',
        message: 'Monitoring seismic activity',
        metrics: {
          activeQuakes: this.detectedQuakes.size,
          lastCheck: this.lastCheckTime.toISOString(),
          minMagnitude: this.minMagnitude,
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

  private async checkForEarthquakes(): Promise<QuakeData[]> {
    try {
      // Try to get real data from USGS
      return await this.fetchUSGSData();
    } catch (error) {
      // Fall back to simulation if API is unavailable
      if (Math.random() > 0.97) {
        return this.simulateEarthquakeDetection();
      }
      return [];
    }
  }

  private async fetchUSGSData(): Promise<QuakeData[]> {
    const url = `${this.usgsApiUrl}/all_hour.geojson`;
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      
      if (!data.features) {
        return [];
      }

      return data.features
        .filter((feature: any) => feature.properties.mag >= this.minMagnitude)
        .map((feature: any) => ({
          id: feature.id,
          magnitude: feature.properties.mag,
          location: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            depth: feature.geometry.coordinates[2],
            place: feature.properties.place,
          },
          time: new Date(feature.properties.time).toISOString(),
          tsunami: feature.properties.tsunami === 1,
          alert: feature.properties.alert,
        }));
    } catch (error) {
      this.logger.error('Failed to fetch USGS data:', error);
      throw error;
    }
  }

  private simulateEarthquakeDetection(): QuakeData[] {
    const locations = [
      { lat: 37.7749, lon: -122.4194, place: 'San Francisco, CA' },
      { lat: 34.0522, lon: -118.2437, place: 'Los Angeles, CA' },
      { lat: 35.6762, lon: 139.6503, place: 'Tokyo, Japan' },
      { lat: -33.4489, lon: -70.6693, place: 'Santiago, Chile' },
      { lat: 40.7128, lon: -74.0060, place: 'New York, NY' },
    ];

    const location = locations[Math.floor(Math.random() * locations.length)];
    const magnitude = this.minMagnitude + Math.random() * 3;
    
    return [{
      id: `sim_${Date.now()}`,
      magnitude,
      location: {
        latitude: location.lat + (Math.random() - 0.5) * 0.5,
        longitude: location.lon + (Math.random() - 0.5) * 0.5,
        depth: 5 + Math.random() * 50,
        place: location.place,
      },
      time: new Date().toISOString(),
      tsunami: magnitude > 6.5 && Math.random() > 0.7,
      alert: magnitude > 5.5 ? 'yellow' : undefined,
    }];
  }

  private async analyzeAndReportQuake(quake: QuakeData): Promise<void> {
    const isNewQuake = !this.detectedQuakes.has(quake.id);
    this.detectedQuakes.set(quake.id, quake);

    if (isNewQuake) {
      const severity = this.calculateSeverity(quake);
      
      const event: DisasterEvent = {
        id: quake.id,
        type: 'earthquake',
        severity,
        location: {
          lat: quake.location.latitude,
          lon: quake.location.longitude,
          name: quake.location.place,
          radius: this.estimateImpactRadius(quake.magnitude),
        },
        data: {
          magnitude: quake.magnitude,
          depth: quake.location.depth,
          tsunami: quake.tsunami,
          alert: quake.alert,
          time: quake.time,
        },
        timestamp: new Date().toISOString(),
      };

      // Emit disaster event
      this.emit('disaster_detected', event);
      
      // Send messages to other agents
      this.sendMessage('ThreatAnalyzer', 'new_threat', event);
      
      if (quake.tsunami) {
        this.sendMessage('FloodMonitor', 'tsunami_warning', {
          quake: event,
          estimatedArrival: this.estimateTsunamiArrival(quake),
        });
      }
      
      this.logActivity('Earthquake detected and reported', {
        location: quake.location.place,
        magnitude: quake.magnitude,
        severity,
      });
    }
  }

  private calculateSeverity(quake: QuakeData): 'low' | 'medium' | 'high' | 'critical' {
    if (quake.magnitude >= 7.0) {
      return 'critical';
    } else if (quake.magnitude >= 6.0) {
      return 'high';
    } else if (quake.magnitude >= 5.0) {
      return 'medium';
    }
    return 'low';
  }

  private estimateImpactRadius(magnitude: number): number {
    // Rough estimate of impact radius in kilometers based on magnitude
    return Math.pow(10, (magnitude - 3) / 2) * 10;
  }

  private estimateTsunamiArrival(quake: QuakeData): string {
    // Simplified tsunami arrival time estimation
    // In reality, this would require complex oceanographic modeling
    const hoursToArrival = Math.random() * 6 + 1;
    const arrivalTime = new Date();
    arrivalTime.setHours(arrivalTime.getHours() + hoursToArrival);
    return arrivalTime.toISOString();
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request_status':
        this.sendMessage(message.from, 'status_response', this.getStatus());
        break;
        
      case 'check_location':
        this.checkLocationForQuakes(message.data);
        break;
        
      case 'get_recent_quakes':
        this.sendRecentQuakes(message.from);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private checkLocationForQuakes(location: { lat: number; lon: number; radius: number }) {
    const nearbyQuakes: QuakeData[] = [];
    
    this.detectedQuakes.forEach((quake) => {
      const distance = this.calculateDistance(
        location.lat,
        location.lon,
        quake.location.latitude,
        quake.location.longitude
      );
      
      if (distance <= location.radius) {
        nearbyQuakes.push(quake);
      }
    });

    if (nearbyQuakes.length > 0) {
      this.sendMessage('ThreatAnalyzer', 'location_quakes', {
        location,
        quakes: nearbyQuakes,
      });
    }
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

  private sendRecentQuakes(requester: string) {
    const recentQuakes = Array.from(this.detectedQuakes.values())
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
    
    this.sendMessage(requester, 'recent_quakes', recentQuakes);
  }

  protected cleanup(): void {
    this.detectedQuakes.clear();
  }

  protected getProcessingInterval(): number {
    // Check for earthquakes every 1 minute
    return 60000;
  }
}