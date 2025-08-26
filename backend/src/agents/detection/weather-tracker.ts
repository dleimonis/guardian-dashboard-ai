import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';
import axios from 'axios';

interface WeatherData {
  id: string;
  type: 'tornado' | 'hurricane' | 'thunderstorm' | 'blizzard' | 'heatwave';
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  severity: string;
  windSpeed?: number;
  precipitation?: number;
  temperature?: number;
  alerts: string[];
  validUntil: string;
}

export class WeatherTrackerAgent extends BaseAgent {
  private activeWeatherEvents: Map<string, WeatherData> = new Map();
  private noaaApiKey: string;
  private lastUpdateTime: Date;

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'WeatherTracker',
      'Monitors severe weather conditions from NOAA',
      logger,
      orchestrator
    );
    this.noaaApiKey = process.env.NOAA_API_KEY || '';
    this.lastUpdateTime = new Date();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing...`);
    
    try {
      await this.testNOAAConnection();
      this.logActivity('NOAA Weather API connection established');
    } catch (error) {
      this.logger.warn(`${this.name} running in simulation mode - NOAA API not available`);
    }
  }

  private async testNOAAConnection(): Promise<void> {
    const testUrl = 'https://api.weather.gov/alerts/active';
    
    try {
      const response = await axios.get(testUrl, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'GuardianDashboard/1.0',
        },
      });
      if (response.status === 200) {
        this.logger.info('NOAA API test successful');
      }
    } catch (error) {
      throw new Error('NOAA API connection failed');
    }
  }

  protected async process(): Promise<void> {
    try {
      const weatherEvents = await this.checkForSevereWeather();
      
      if (weatherEvents.length > 0) {
        this.logActivity(`Detected ${weatherEvents.length} severe weather events`);
        
        for (const event of weatherEvents) {
          await this.analyzeAndReportWeather(event);
        }
      }

      this.updateStatus({
        status: 'online',
        message: 'Monitoring weather patterns',
        metrics: {
          activeEvents: this.activeWeatherEvents.size,
          lastUpdate: this.lastUpdateTime.toISOString(),
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

  private async checkForSevereWeather(): Promise<WeatherData[]> {
    try {
      // Try to get real data from NOAA
      return await this.fetchNOAAData();
    } catch (error) {
      // Fall back to simulation if API is unavailable
      if (Math.random() > 0.93) {
        return this.simulateWeatherEvent();
      }
      return [];
    }
  }

  private async fetchNOAAData(): Promise<WeatherData[]> {
    const url = 'https://api.weather.gov/alerts/active';
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'GuardianDashboard/1.0',
        },
      });
      
      const data = response.data;
      
      if (!data.features) {
        return [];
      }

      // Filter for severe weather only
      const severeEvents = data.features.filter((feature: any) => {
        const severity = feature.properties.severity;
        const urgency = feature.properties.urgency;
        return (severity === 'Severe' || severity === 'Extreme') && 
               (urgency === 'Immediate' || urgency === 'Expected');
      });

      return severeEvents.map((feature: any) => ({
        id: feature.properties.id,
        type: this.categorizeWeatherEvent(feature.properties.event),
        location: {
          latitude: feature.geometry?.coordinates?.[0]?.[1] || 0,
          longitude: feature.geometry?.coordinates?.[0]?.[0] || 0,
          name: feature.properties.areaDesc,
        },
        severity: feature.properties.severity,
        alerts: [feature.properties.headline],
        validUntil: feature.properties.expires,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch NOAA data:', error);
      throw error;
    }
  }

  private categorizeWeatherEvent(eventType: string): WeatherData['type'] {
    const eventLower = eventType.toLowerCase();
    
    if (eventLower.includes('tornado')) return 'tornado';
    if (eventLower.includes('hurricane') || eventLower.includes('cyclone')) return 'hurricane';
    if (eventLower.includes('blizzard') || eventLower.includes('snow')) return 'blizzard';
    if (eventLower.includes('heat')) return 'heatwave';
    
    return 'thunderstorm';
  }

  private simulateWeatherEvent(): WeatherData[] {
    const events = [
      {
        type: 'tornado' as const,
        location: { lat: 35.2271, lon: -97.4726, name: 'Oklahoma City, OK' },
        windSpeed: 200,
      },
      {
        type: 'hurricane' as const,
        location: { lat: 25.7617, lon: -80.1918, name: 'Miami, FL' },
        windSpeed: 150,
      },
      {
        type: 'thunderstorm' as const,
        location: { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' },
        windSpeed: 75,
      },
      {
        type: 'blizzard' as const,
        location: { lat: 44.9778, lon: -93.2650, name: 'Minneapolis, MN' },
        precipitation: 24,
      },
      {
        type: 'heatwave' as const,
        location: { lat: 33.4484, lon: -112.0740, name: 'Phoenix, AZ' },
        temperature: 118,
      },
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    
    return [{
      id: `sim_weather_${Date.now()}`,
      type: event.type,
      location: {
        latitude: event.location.lat,
        longitude: event.location.lon,
        name: event.location.name,
      },
      severity: 'Severe',
      windSpeed: event.windSpeed,
      precipitation: event.precipitation,
      temperature: event.temperature,
      alerts: [`Simulated ${event.type} warning for ${event.location.name}`],
      validUntil: new Date(Date.now() + 6 * 3600000).toISOString(),
    }];
  }

  private async analyzeAndReportWeather(weather: WeatherData): Promise<void> {
    const isNewEvent = !this.activeWeatherEvents.has(weather.id);
    this.activeWeatherEvents.set(weather.id, weather);

    if (isNewEvent) {
      const severity = this.calculateSeverity(weather);
      
      const event: DisasterEvent = {
        id: weather.id,
        type: 'weather',
        severity,
        location: {
          lat: weather.location.latitude,
          lon: weather.location.longitude,
          name: weather.location.name,
          radius: this.estimateAffectedRadius(weather),
        },
        data: {
          weatherType: weather.type,
          windSpeed: weather.windSpeed,
          precipitation: weather.precipitation,
          temperature: weather.temperature,
          alerts: weather.alerts,
          validUntil: weather.validUntil,
        },
        timestamp: new Date().toISOString(),
      };

      // Emit disaster event
      this.emit('disaster_detected', event);
      
      // Send to threat analyzer
      this.sendMessage('ThreatAnalyzer', 'new_threat', event);
      
      // Alert flood monitor if heavy precipitation
      if (weather.precipitation && weather.precipitation > 10) {
        this.sendMessage('FloodMonitor', 'heavy_precipitation', {
          location: weather.location,
          amount: weather.precipitation,
        });
      }
      
      this.logActivity('Severe weather detected and reported', {
        type: weather.type,
        location: weather.location.name,
        severity,
      });
    }
  }

  private calculateSeverity(weather: WeatherData): 'low' | 'medium' | 'high' | 'critical' {
    // Tornado or hurricane is always critical
    if (weather.type === 'tornado' || weather.type === 'hurricane') {
      return 'critical';
    }
    
    // Check wind speed
    if (weather.windSpeed) {
      if (weather.windSpeed > 100) return 'critical';
      if (weather.windSpeed > 75) return 'high';
      if (weather.windSpeed > 50) return 'medium';
    }
    
    // Check temperature extremes
    if (weather.temperature) {
      if (weather.temperature > 110 || weather.temperature < -20) return 'high';
      if (weather.temperature > 100 || weather.temperature < 0) return 'medium';
    }
    
    // Check precipitation
    if (weather.precipitation) {
      if (weather.precipitation > 20) return 'high';
      if (weather.precipitation > 10) return 'medium';
    }
    
    return 'low';
  }

  private estimateAffectedRadius(weather: WeatherData): number {
    // Estimate affected area radius in kilometers
    switch (weather.type) {
      case 'hurricane':
        return 200;
      case 'tornado':
        return 10;
      case 'thunderstorm':
        return 50;
      case 'blizzard':
        return 100;
      case 'heatwave':
        return 150;
      default:
        return 30;
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'request_status':
        this.sendMessage(message.from, 'status_response', this.getStatus());
        break;
        
      case 'check_location':
        this.checkLocationWeather(message.data);
        break;
        
      case 'get_forecast':
        this.getForecast(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private checkLocationWeather(location: { lat: number; lon: number }) {
    // Check weather conditions at specific location
    this.logger.debug(`Checking weather at ${location.lat}, ${location.lon}`);
    
    // In production, this would query weather APIs for the location
    // For now, check if any active events affect this location
    const nearbyEvents: WeatherData[] = [];
    
    this.activeWeatherEvents.forEach((event) => {
      const distance = this.calculateDistance(
        location.lat,
        location.lon,
        event.location.latitude,
        event.location.longitude
      );
      
      const radius = this.estimateAffectedRadius(event);
      if (distance <= radius) {
        nearbyEvents.push(event);
      }
    });
    
    if (nearbyEvents.length > 0) {
      this.sendMessage('ThreatAnalyzer', 'location_weather', {
        location,
        events: nearbyEvents,
      });
    }
  }

  private getForecast(requester: string, location: { lat: number; lon: number }) {
    // Get weather forecast for location
    // In production, this would call weather forecast APIs
    
    const forecast = {
      location,
      forecast: [
        { time: '6h', condition: 'clear', temp: 75, windSpeed: 10 },
        { time: '12h', condition: 'cloudy', temp: 72, windSpeed: 15 },
        { time: '24h', condition: 'rain', temp: 68, windSpeed: 20 },
      ],
    };
    
    this.sendMessage(requester, 'forecast_response', forecast);
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

  protected cleanup(): void {
    // Clean up expired weather events
    const now = new Date();
    this.activeWeatherEvents.forEach((event, id) => {
      if (new Date(event.validUntil) < now) {
        this.activeWeatherEvents.delete(id);
      }
    });
  }

  protected getProcessingInterval(): number {
    // Check weather every 2 minutes
    return 120000;
  }
}