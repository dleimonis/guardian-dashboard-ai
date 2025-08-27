import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage, DisasterEvent } from '../orchestrator';
import axios from 'axios';

interface FloodData {
  locationId: string;
  location: {
    lat: number;
    lon: number;
    name: string;
    riverName?: string;
  };
  waterLevel: number; // meters above normal
  flowRate: number; // cubic meters per second
  precipitationRate: number; // mm per hour
  trend: 'rising' | 'steady' | 'falling';
  alertLevel: 'normal' | 'watch' | 'warning' | 'danger' | 'critical';
  predictedPeak: {
    level: number;
    time: Date;
  };
  affectedAreas: string[];
}

interface GaugeStation {
  stationId: string;
  name: string;
  location: { lat: number; lon: number };
  riverName: string;
  normalLevel: number;
  warningLevel: number;
  dangerLevel: number;
  currentReading?: number;
  lastUpdate?: Date;
}

export class FloodMonitorAgent extends BaseAgent {
  private gaugeStations: Map<string, GaugeStation> = new Map();
  private activeFloods: Map<string, FloodData> = new Map();
  private historicalData: Map<string, number[]> = new Map(); // Store historical water levels
  private precipitationData: Map<string, number> = new Map();
  private apiEndpoints = {
    usgs: 'https://waterservices.usgs.gov/nwis/iv/',
    noaa: 'https://water.weather.gov/ahps/ws/',
  };

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'FloodMonitor',
      'Monitors water levels and flood conditions',
      logger,
      orchestrator
    );
    this.initializeGaugeStations();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing flood monitoring system...`);
    
    // Test API connections
    try {
      await this.testWaterDataConnections();
      this.logActivity('Water monitoring APIs connected');
    } catch (error) {
      this.logger.warn(`${this.name} running in simulation mode - Water APIs not available`);
    }
  }

  private initializeGaugeStations(): void {
    // Initialize with major river gauge stations
    const stations: GaugeStation[] = [
      {
        stationId: 'MS_001',
        name: 'Mississippi River at New Orleans',
        location: { lat: 29.9511, lon: -90.0715 },
        riverName: 'Mississippi River',
        normalLevel: 2.5,
        warningLevel: 4.3,
        dangerLevel: 5.2,
      },
      {
        stationId: 'CO_001',
        name: 'Colorado River at Austin',
        location: { lat: 30.2672, lon: -97.7431 },
        riverName: 'Colorado River',
        normalLevel: 1.8,
        warningLevel: 3.5,
        dangerLevel: 4.5,
      },
      {
        stationId: 'OH_001',
        name: 'Ohio River at Cincinnati',
        location: { lat: 39.1031, lon: -84.5120 },
        riverName: 'Ohio River',
        normalLevel: 3.0,
        warningLevel: 5.0,
        dangerLevel: 6.0,
      },
      {
        stationId: 'MO_001',
        name: 'Missouri River at Kansas City',
        location: { lat: 39.0997, lon: -94.5786 },
        riverName: 'Missouri River',
        normalLevel: 2.2,
        warningLevel: 4.0,
        dangerLevel: 5.0,
      },
      {
        stationId: 'HU_001',
        name: 'Hudson River at Albany',
        location: { lat: 42.6526, lon: -73.7562 },
        riverName: 'Hudson River',
        normalLevel: 1.5,
        warningLevel: 3.0,
        dangerLevel: 4.0,
      },
    ];

    for (const station of stations) {
      this.gaugeStations.set(station.stationId, station);
      this.historicalData.set(station.stationId, []);
    }
  }

  private async testWaterDataConnections(): Promise<void> {
    // Test USGS water data service
    try {
      const response = await axios.get(this.apiEndpoints.usgs, {
        params: {
          format: 'json',
          sites: '01372058', // Test site
          parameterCd: '00065', // Gauge height
        },
        timeout: 5000,
      });
      
      if (response.status === 200) {
        this.logger.info('USGS water data service connection successful');
      }
    } catch (error: any) {
      throw new Error('Failed to connect to water data services');
    }
  }

  protected async process(): Promise<void> {
    try {
      // Check water levels at all stations
      await this.checkWaterLevels();
      
      // Monitor precipitation data
      this.updatePrecipitationData();
      
      // Analyze flood risk
      this.analyzeFloodRisk();
      
      // Update predictions
      this.updateFloodPredictions();
      
      // Clean up resolved floods
      this.cleanupResolvedFloods();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Monitoring water levels',
        metrics: {
          monitoredStations: this.gaugeStations.size,
          activeFloods: this.activeFloods.size,
          criticalLevels: Array.from(this.activeFloods.values())
            .filter(f => f.alertLevel === 'critical').length,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Flood monitoring error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'check_location':
        this.checkLocationFloodRisk(message.data);
        break;
        
      case 'request_water_levels':
        this.provideWaterLevels(message.from);
        break;
        
      case 'update_precipitation':
        this.updatePrecipitationForLocation(message.data);
        break;
        
      case 'add_gauge_station':
        this.addGaugeStation(message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private async checkWaterLevels(): Promise<void> {
    // Check each gauge station
    for (const [stationId, station] of this.gaugeStations) {
      const waterLevel = await this.getWaterLevel(station);
      
      if (waterLevel !== null) {
        station.currentReading = waterLevel;
        station.lastUpdate = new Date();
        
        // Store historical data
        const history = this.historicalData.get(stationId) || [];
        history.push(waterLevel);
        if (history.length > 100) history.shift(); // Keep last 100 readings
        this.historicalData.set(stationId, history);
        
        // Check for flood conditions
        if (waterLevel > station.warningLevel) {
          this.detectFloodCondition(station, waterLevel);
        }
      }
    }
  }

  private async getWaterLevel(station: GaugeStation): Promise<number | null> {
    // In production, this would fetch real data from USGS/NOAA
    // For demo, simulate water levels
    
    const baseLevel = station.normalLevel;
    const variation = Math.sin(Date.now() / 3600000) * 0.5; // Hourly variation
    const randomFactor = Math.random() * 0.3;
    
    // Simulate flood conditions occasionally
    let waterLevel = baseLevel + variation + randomFactor;
    
    // 5% chance of significant water level rise
    if (Math.random() > 0.95) {
      waterLevel += Math.random() * 3;
      
      // Add precipitation effect
      const precipitation = this.precipitationData.get(station.stationId) || 0;
      waterLevel += precipitation * 0.01;
    }
    
    return waterLevel;
  }

  private detectFloodCondition(station: GaugeStation, waterLevel: number): void {
    const floodId = `flood_${station.stationId}_${Date.now()}`;
    
    // Check if flood already reported for this station
    const existingFlood = Array.from(this.activeFloods.values())
      .find(f => f.locationId === station.stationId);
    
    if (existingFlood) {
      // Update existing flood data
      existingFlood.waterLevel = waterLevel;
      existingFlood.trend = this.calculateTrend(station.stationId);
      existingFlood.alertLevel = this.determineAlertLevel(station, waterLevel);
      existingFlood.predictedPeak = this.predictPeakLevel(station, waterLevel);
    } else {
      // Create new flood event
      const floodData: FloodData = {
        locationId: station.stationId,
        location: {
          ...station.location,
          name: station.name,
          riverName: station.riverName,
        },
        waterLevel: waterLevel - station.normalLevel,
        flowRate: this.estimateFlowRate(waterLevel),
        precipitationRate: this.precipitationData.get(station.stationId) || 0,
        trend: this.calculateTrend(station.stationId),
        alertLevel: this.determineAlertLevel(station, waterLevel),
        predictedPeak: this.predictPeakLevel(station, waterLevel),
        affectedAreas: this.identifyAffectedAreas(station, waterLevel),
      };
      
      this.activeFloods.set(floodId, floodData);
      
      // Create disaster event
      const severity = this.calculateFloodSeverity(floodData);
      
      const event: DisasterEvent = {
        id: floodId,
        type: 'flood',
        severity,
        location: {
          lat: station.location.lat,
          lon: station.location.lon,
          name: station.name,
          radius: this.calculateFloodRadius(waterLevel - station.normalLevel),
        },
        data: {
          waterLevel: waterLevel,
          aboveNormal: waterLevel - station.normalLevel,
          flowRate: floodData.flowRate,
          trend: floodData.trend,
          alertLevel: floodData.alertLevel,
          riverName: station.riverName,
          predictedPeak: floodData.predictedPeak,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Emit disaster event
      this.emit('disaster_detected', event);
      
      // Send to threat analyzer
      this.sendMessage('ThreatAnalyzer', 'new_threat', event);
      
      this.logActivity('Flood condition detected', {
        location: station.name,
        waterLevel: waterLevel.toFixed(2),
        alertLevel: floodData.alertLevel,
      });
    }
  }

  private calculateTrend(stationId: string): 'rising' | 'steady' | 'falling' {
    const history = this.historicalData.get(stationId) || [];
    if (history.length < 3) return 'steady';
    
    const recent = history.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgPrevious = history.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    
    if (avgRecent > avgPrevious + 0.1) return 'rising';
    if (avgRecent < avgPrevious - 0.1) return 'falling';
    return 'steady';
  }

  private determineAlertLevel(station: GaugeStation, waterLevel: number): FloodData['alertLevel'] {
    if (waterLevel >= station.dangerLevel * 1.2) return 'critical';
    if (waterLevel >= station.dangerLevel) return 'danger';
    if (waterLevel >= station.warningLevel) return 'warning';
    if (waterLevel >= station.normalLevel * 1.5) return 'watch';
    return 'normal';
  }

  private estimateFlowRate(waterLevel: number): number {
    // Simplified flow rate estimation based on water level
    // In reality, this would use Manning's equation or actual sensor data
    return waterLevel * waterLevel * 50; // Cubic meters per second
  }

  private predictPeakLevel(station: GaugeStation, currentLevel: number): { level: number; time: Date } {
    const trend = this.calculateTrend(station.stationId);
    const precipitation = this.precipitationData.get(station.stationId) || 0;
    
    let predictedPeak = currentLevel;
    let hoursToP = 6; // Default 6 hours
    
    if (trend === 'rising') {
      // Estimate peak based on precipitation and current rate of rise
      const rateOfRise = this.calculateRateOfRise(station.stationId);
      predictedPeak = currentLevel + (rateOfRise * 6) + (precipitation * 0.02);
      hoursToP = 6 + Math.random() * 6; // 6-12 hours
    } else if (trend === 'falling') {
      // Peak has passed
      predictedPeak = currentLevel;
      hoursToP = 0;
    }
    
    return {
      level: predictedPeak,
      time: new Date(Date.now() + hoursToP * 3600000),
    };
  }

  private calculateRateOfRise(stationId: string): number {
    const history = this.historicalData.get(stationId) || [];
    if (history.length < 2) return 0;
    
    const recent = history.slice(-5);
    const differences = [];
    
    for (let i = 1; i < recent.length; i++) {
      differences.push(recent[i] - recent[i - 1]);
    }
    
    return differences.reduce((a, b) => a + b, 0) / differences.length;
  }

  private identifyAffectedAreas(station: GaugeStation, waterLevel: number): string[] {
    const areas: string[] = [];
    
    // Add immediate area
    areas.push(station.name);
    areas.push(`${station.riverName} basin`);
    
    // Add downstream areas based on water level
    const excess = waterLevel - station.warningLevel;
    if (excess > 0) {
      areas.push('Low-lying areas');
      areas.push('Riverfront properties');
    }
    
    if (excess > 1) {
      areas.push('Downtown district');
      areas.push('Industrial zone');
    }
    
    if (excess > 2) {
      areas.push('Residential areas');
      areas.push('Agricultural land');
    }
    
    return areas;
  }

  private calculateFloodSeverity(flood: FloodData): DisasterEvent['severity'] {
    if (flood.alertLevel === 'critical') return 'critical';
    if (flood.alertLevel === 'danger') return 'high';
    if (flood.alertLevel === 'warning') return 'medium';
    return 'low';
  }

  private calculateFloodRadius(aboveNormal: number): number {
    // Estimate flood extent radius based on water level above normal
    // Base radius 5km, expanding by 2km per meter above normal
    return 5 + (aboveNormal * 2);
  }

  private updatePrecipitationData(): void {
    // Update precipitation data for each station
    for (const [stationId, station] of this.gaugeStations) {
      // Simulate precipitation (in production, would fetch from weather API)
      let precipitation = this.precipitationData.get(stationId) || 0;
      
      // Random precipitation events
      if (Math.random() > 0.8) {
        precipitation = Math.random() * 50; // 0-50mm/hour
      } else {
        precipitation = Math.max(0, precipitation - 5); // Decrease over time
      }
      
      this.precipitationData.set(stationId, precipitation);
      
      // Heavy rainfall warning
      if (precipitation > 30) {
        this.sendMessage('WeatherTracker', 'heavy_rainfall', {
          location: station.location,
          rate: precipitation,
          riverName: station.riverName,
        });
      }
    }
  }

  private analyzeFloodRisk(): void {
    for (const [stationId, station] of this.gaugeStations) {
      const waterLevel = station.currentReading || station.normalLevel;
      const precipitation = this.precipitationData.get(stationId) || 0;
      const trend = this.calculateTrend(stationId);
      
      // Calculate flood risk score
      let riskScore = 0;
      
      // Water level contribution
      if (waterLevel > station.normalLevel) {
        riskScore += ((waterLevel - station.normalLevel) / station.normalLevel) * 40;
      }
      
      // Precipitation contribution
      riskScore += (precipitation / 50) * 30;
      
      // Trend contribution
      if (trend === 'rising') riskScore += 20;
      else if (trend === 'falling') riskScore -= 10;
      
      // Historical flooding tendency (simulated)
      riskScore += Math.random() * 10;
      
      // Alert if high risk
      if (riskScore > 60 && !this.hasActiveFlood(stationId)) {
        this.logActivity('High flood risk detected', {
          location: station.name,
          riskScore: riskScore.toFixed(1),
          factors: {
            waterLevel: waterLevel.toFixed(2),
            precipitation: precipitation.toFixed(1),
            trend: trend,
          },
        });
        
        // Send pre-emptive warning
        this.sendMessage('AlertDispatcher', 'flood_risk_warning', {
          location: station.location,
          riskScore,
          predictedTimeframe: '6-12 hours',
        });
      }
    }
  }

  private hasActiveFlood(stationId: string): boolean {
    return Array.from(this.activeFloods.values())
      .some(f => f.locationId === stationId);
  }

  private updateFloodPredictions(): void {
    for (const [id, flood] of this.activeFloods) {
      const station = this.gaugeStations.get(flood.locationId);
      if (station && station.currentReading) {
        // Update predictions
        flood.predictedPeak = this.predictPeakLevel(station, station.currentReading);
        flood.trend = this.calculateTrend(station.stationId);
        
        // Check if flood is worsening
        if (flood.trend === 'rising' && flood.alertLevel === 'danger') {
          // Send urgent update
          this.sendMessage('PriorityManager', 'flood_escalation', {
            floodId: id,
            currentLevel: station.currentReading,
            predictedPeak: flood.predictedPeak,
            affectedAreas: flood.affectedAreas,
          });
        }
      }
    }
  }

  private cleanupResolvedFloods(): void {
    for (const [id, flood] of this.activeFloods) {
      const station = this.gaugeStations.get(flood.locationId);
      
      if (station && station.currentReading) {
        // Check if water has receded
        if (station.currentReading < station.warningLevel && flood.trend === 'falling') {
          this.activeFloods.delete(id);
          
          // Send all-clear
          this.sendMessage('AlertDispatcher', 'flood_cleared', {
            floodId: id,
            location: flood.location,
          });
          
          this.logActivity('Flood condition cleared', {
            location: station.name,
            finalLevel: station.currentReading.toFixed(2),
          });
        }
      }
    }
  }

  private checkLocationFloodRisk(data: any): void {
    const { lat, lon, radius } = data;
    
    // Find nearby gauge stations
    const nearbyStations = Array.from(this.gaugeStations.values())
      .filter(station => {
        const distance = this.calculateDistance(lat, lon, station.location.lat, station.location.lon);
        return distance <= radius;
      });
    
    // Check for flood risk at nearby stations
    const risks = nearbyStations.map(station => ({
      station: station.name,
      currentLevel: station.currentReading || station.normalLevel,
      alertLevel: station.currentReading ? 
        this.determineAlertLevel(station, station.currentReading) : 'normal',
      distance: this.calculateDistance(lat, lon, station.location.lat, station.location.lon),
    }));
    
    this.sendMessage(data.requester || 'orchestrator', 'flood_risk_response', {
      location: { lat, lon },
      nearbyRisks: risks,
      overallRisk: risks.some(r => r.alertLevel !== 'normal' && r.alertLevel !== 'watch'),
    });
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

  private provideWaterLevels(requester: string): void {
    const levels = Array.from(this.gaugeStations.values()).map(station => ({
      stationId: station.stationId,
      name: station.name,
      location: station.location,
      currentLevel: station.currentReading || station.normalLevel,
      normalLevel: station.normalLevel,
      warningLevel: station.warningLevel,
      dangerLevel: station.dangerLevel,
      lastUpdate: station.lastUpdate,
      trend: this.calculateTrend(station.stationId),
    }));
    
    this.sendMessage(requester, 'water_levels_response', levels);
  }

  private updatePrecipitationForLocation(data: any): void {
    // Find nearest gauge station
    let nearestStation: GaugeStation | null = null;
    let minDistance = Infinity;
    
    for (const station of this.gaugeStations.values()) {
      const distance = this.calculateDistance(
        data.location.lat,
        data.location.lon,
        station.location.lat,
        station.location.lon
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }
    
    if (nearestStation) {
      this.precipitationData.set(nearestStation.stationId, data.rate);
      this.logActivity('Precipitation data updated', {
        station: nearestStation.name,
        rate: data.rate,
      });
    }
  }

  private addGaugeStation(data: any): void {
    const station: GaugeStation = {
      stationId: data.stationId || `custom_${Date.now()}`,
      name: data.name,
      location: data.location,
      riverName: data.riverName || 'Unknown River',
      normalLevel: data.normalLevel || 2.0,
      warningLevel: data.warningLevel || 4.0,
      dangerLevel: data.dangerLevel || 5.0,
    };
    
    this.gaugeStations.set(station.stationId, station);
    this.historicalData.set(station.stationId, []);
    
    this.logActivity('Gauge station added', {
      stationId: station.stationId,
      name: station.name,
    });
  }

  protected cleanup(): void {
    this.activeFloods.clear();
    this.precipitationData.clear();
    // Reset historical data
    for (const key of this.historicalData.keys()) {
      this.historicalData.set(key, []);
    }
  }

  protected getProcessingInterval(): number {
    return 60000; // Check every minute for flood conditions
  }
}