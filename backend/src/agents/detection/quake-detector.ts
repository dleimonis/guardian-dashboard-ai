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
  private useRealData: boolean;
  private lastApiCall: Date | null = null;
  private apiCallInterval: number = 300000; // 5 minutes in milliseconds

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'QuakeDetector',
      'Monitors global seismic activity from USGS',
      logger,
      orchestrator
    );
    this.lastCheckTime = new Date();
    this.minMagnitude = parseFloat(process.env.EARTHQUAKE_MIN_MAGNITUDE || '2.5'); // Lower threshold for more data
    this.usgsApiUrl = process.env.USGS_API_URL || 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
    this.useRealData = process.env.USE_REAL_EARTHQUAKE_DATA !== 'false'; // Default to true
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing...`);
    
    if (this.useRealData) {
      try {
        await this.testUSGSConnection();
        this.logActivity('USGS API connection established - using REAL earthquake data');
        this.logger.info('✅ QuakeDetector connected to REAL USGS earthquake feed');
      } catch (error) {
        this.logger.warn(`${this.name} falling back to simulation mode - USGS API not available`);
        this.useRealData = false;
      }
    } else {
      this.logger.info(`${this.name} configured for simulation mode`);
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
    // Check if we should use real data and respect rate limiting
    if (this.useRealData) {
      const now = new Date();
      
      // Rate limit API calls to every 5 minutes
      if (!this.lastApiCall || (now.getTime() - this.lastApiCall.getTime()) >= this.apiCallInterval) {
        try {
          this.lastApiCall = now;
          const realData = await this.fetchUSGSData();
          
          if (realData.length > 0) {
            this.logger.info(`🌍 Fetched ${realData.length} real earthquakes from USGS`);
          }
          
          return realData;
        } catch (error) {
          this.logger.error('Failed to fetch real USGS data, falling back to simulation:', error);
          this.useRealData = false; // Temporarily disable real data
          
          // Re-enable after 10 minutes
          setTimeout(() => {
            this.useRealData = process.env.USE_REAL_EARTHQUAKE_DATA !== 'false';
            this.logger.info('Re-enabling real USGS data fetching');
          }, 600000);
        }
      }
    }
    
    // Fall back to simulation
    if (Math.random() > 0.95) { // Reduced frequency for simulation
      return this.simulateEarthquakeDetection();
    }
    
    return [];
  }

  private async fetchUSGSData(): Promise<QuakeData[]> {
    // Use 'all_hour' for recent earthquakes or 'all_day' for more data
    const timeframe = this.minMagnitude < 3 ? 'all_day' : 'all_hour';
    const url = `${this.usgsApiUrl}/${timeframe}.geojson`;
    
    this.logger.debug(`Fetching earthquakes from: ${url}`);
    
    try {
      const response = await axios.get(url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Guardian-Dashboard-AI/1.0',
          'Accept': 'application/json'
        }
      });
      
      const data = response.data;
      
      if (!data.features || !Array.isArray(data.features)) {
        this.logger.warn('Invalid USGS response format');
        return [];
      }

      const earthquakes = data.features
        .filter((feature: any) => 
          feature.properties && 
          feature.properties.mag >= this.minMagnitude &&
          feature.geometry && 
          feature.geometry.coordinates
        )
        .map((feature: any) => ({
          id: feature.id,
          magnitude: feature.properties.mag,
          location: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            depth: feature.geometry.coordinates[2],
            place: feature.properties.place || 'Unknown location',
          },
          time: new Date(feature.properties.time).toISOString(),
          tsunami: feature.properties.tsunami === 1,
          alert: feature.properties.alert,
        }));
      
      // Log some interesting earthquakes for debugging
      if (earthquakes.length > 0) {
        const significantQuakes = earthquakes.filter((q: QuakeData) => q.magnitude >= 4.0);
        if (significantQuakes.length > 0) {
          this.logger.info(`🌍 Significant earthquakes detected:`, 
            significantQuakes.map((q: QuakeData) => `M${q.magnitude} at ${q.location.place}`).join(', ')
          );
        }
      }
      
      return earthquakes;
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
    // Check every 30 seconds for simulation, every 5 minutes for real data
    return this.useRealData ? 30000 : 30000; // Keep checking frequently but API calls are rate limited
  }
}