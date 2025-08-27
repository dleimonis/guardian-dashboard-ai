import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from '../orchestrator';

interface EvacuationRoute {
  routeId: string;
  disasterId: string;
  startPoint: { lat: number; lon: number; name: string };
  endPoint: { lat: number; lon: number; name: string };
  distance: number; // kilometers
  estimatedTime: number; // minutes
  capacity: number; // number of people
  status: 'clear' | 'congested' | 'blocked';
  alternativeRoutes: string[];
  waypoints: { lat: number; lon: number; type: string }[];
  safetyScore: number; // 0-100
}

interface SafeZone {
  zoneId: string;
  location: { lat: number; lon: number; name: string };
  type: 'shelter' | 'hospital' | 'open_area' | 'evacuation_center';
  capacity: number;
  currentOccupancy: number;
  amenities: string[];
  distanceFromDisaster: number;
}

export class RouteCalculatorAgent extends BaseAgent {
  private evacuationRoutes: Map<string, EvacuationRoute[]> = new Map();
  private safeZones: SafeZone[] = [];
  private blockedRoads: Set<string> = new Set();
  private trafficData: Map<string, number> = new Map(); // road -> congestion level

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'RouteCalculator',
      'Calculates optimal evacuation routes and safe zones',
      logger,
      orchestrator
    );
    this.initializeSafeZones();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing route calculation system...`);
    this.loadRoadNetwork();
    this.logActivity('Route calculation system online');
  }

  private initializeSafeZones(): void {
    // Initialize with predefined safe zones
    this.safeZones = [
      {
        zoneId: 'sz_001',
        location: { lat: 34.0522, lon: -118.2437, name: 'LA Convention Center' },
        type: 'evacuation_center',
        capacity: 10000,
        currentOccupancy: 0,
        amenities: ['medical', 'food', 'water', 'communications'],
        distanceFromDisaster: 0,
      },
      {
        zoneId: 'sz_002',
        location: { lat: 37.7749, lon: -122.4194, name: 'Golden Gate Park' },
        type: 'open_area',
        capacity: 50000,
        currentOccupancy: 0,
        amenities: ['open_space', 'water'],
        distanceFromDisaster: 0,
      },
      {
        zoneId: 'sz_003',
        location: { lat: 40.7128, lon: -74.0060, name: 'Central Park' },
        type: 'open_area',
        capacity: 75000,
        currentOccupancy: 0,
        amenities: ['open_space', 'water', 'medical'],
        distanceFromDisaster: 0,
      },
      {
        zoneId: 'sz_004',
        location: { lat: 41.8781, lon: -87.6298, name: 'United Center' },
        type: 'evacuation_center',
        capacity: 20000,
        currentOccupancy: 0,
        amenities: ['medical', 'food', 'water', 'shelter'],
        distanceFromDisaster: 0,
      },
    ];
  }

  private loadRoadNetwork(): void {
    // Simulate loading road network data
    this.logger.info(`${this.name} loaded road network data`);
  }

  protected async process(): Promise<void> {
    try {
      // Update traffic conditions
      this.updateTrafficConditions();
      
      // Review and optimize existing routes
      this.optimizeRoutes();
      
      // Update safe zone occupancy
      this.updateSafeZoneStatus();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Calculating routes',
        metrics: {
          activeRoutes: this.evacuationRoutes.size,
          availableSafeZones: this.safeZones.filter(z => z.currentOccupancy < z.capacity).length,
          blockedRoads: this.blockedRoads.size,
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Route calculation error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'impact_prediction':
        this.calculateEvacuationRoutes(message.data);
        break;
        
      case 'calculate_route':
        this.calculateSpecificRoute(message.data);
        break;
        
      case 'block_road':
        this.blockRoad(message.data.roadId);
        break;
        
      case 'update_traffic':
        this.updateTrafficData(message.data);
        break;
        
      case 'request_safe_zones':
        this.provideSafeZones(message.from, message.data);
        break;
        
      case 'request_routes':
        this.provideRoutes(message.from, message.data);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private calculateEvacuationRoutes(data: any): void {
    const { disasterId, affectedArea, estimatedDisplaced } = data;
    
    this.logger.info(`${this.name} calculating evacuation routes for disaster ${disasterId}`);
    
    // Update safe zone distances from disaster
    this.updateSafeZoneDistances(affectedArea);
    
    // Get nearest safe zones
    const nearestZones = this.getNearestSafeZones(affectedArea, 5);
    
    // Calculate routes to each safe zone
    const routes: EvacuationRoute[] = [];
    
    for (const zone of nearestZones) {
      const route = this.calculateRoute(affectedArea, zone.location, disasterId);
      routes.push(route);
      
      // Calculate alternative routes
      const altRoute = this.calculateAlternativeRoute(affectedArea, zone.location, disasterId);
      if (altRoute) {
        routes.push(altRoute);
      }
    }
    
    // Store routes
    this.evacuationRoutes.set(disasterId, routes);
    
    // Send routes to priority manager
    this.sendMessage('PriorityManager', 'evacuation_routes', {
      disasterId,
      routes: routes.map(r => ({
        routeId: r.routeId,
        destination: r.endPoint.name,
        estimatedTime: r.estimatedTime,
        capacity: r.capacity,
        safetyScore: r.safetyScore,
      })),
    });
    
    // Send to alert dispatcher
    this.sendMessage('AlertDispatcher', 'evacuation_routes_ready', {
      disasterId,
      primaryRoute: routes[0],
      alternativeRoutes: routes.slice(1, 3),
    });
    
    this.logActivity('Evacuation routes calculated', {
      disasterId,
      routeCount: routes.length,
      primaryDestination: routes[0]?.endPoint.name,
    });
  }

  private calculateRoute(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number; name: string },
    disasterId: string
  ): EvacuationRoute {
    const distance = this.calculateDistance(start.lat, start.lon, end.lat, end.lon);
    const baseTime = (distance / 60) * 60; // Assuming 60 km/h average speed
    
    // Adjust time based on traffic
    const trafficMultiplier = 1 + (Math.random() * 0.5); // Simulate traffic
    const estimatedTime = Math.floor(baseTime * trafficMultiplier);
    
    // Generate waypoints
    const waypoints = this.generateWaypoints(start, end);
    
    // Calculate safety score
    const safetyScore = this.calculateSafetyScore(start, end, disasterId);
    
    return {
      routeId: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      disasterId,
      startPoint: { ...start, name: 'Evacuation Zone' },
      endPoint: end,
      distance,
      estimatedTime,
      capacity: Math.floor(1000 + Math.random() * 4000),
      status: this.determineRouteStatus(estimatedTime),
      alternativeRoutes: [],
      waypoints,
      safetyScore,
    };
  }

  private calculateAlternativeRoute(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number; name: string },
    disasterId: string
  ): EvacuationRoute | null {
    // 70% chance of having an alternative route
    if (Math.random() > 0.3) {
      const route = this.calculateRoute(start, end, disasterId);
      // Make it slightly different
      route.routeId = `alt_${route.routeId}`;
      route.distance *= (1.1 + Math.random() * 0.2);
      route.estimatedTime *= (1.1 + Math.random() * 0.3);
      route.safetyScore = Math.max(route.safetyScore - 10, 50);
      return route;
    }
    return null;
  }

  private generateWaypoints(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number }
  ): { lat: number; lon: number; type: string }[] {
    const waypoints = [];
    const steps = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const lat = start.lat + (end.lat - start.lat) * progress + (Math.random() - 0.5) * 0.01;
      const lon = start.lon + (end.lon - start.lon) * progress + (Math.random() - 0.5) * 0.01;
      
      const types = ['intersection', 'highway_entry', 'checkpoint', 'rest_area'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      waypoints.push({ lat, lon, type });
    }
    
    return waypoints;
  }

  private calculateSafetyScore(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    disasterId: string
  ): number {
    let score = 100;
    
    // Reduce score based on distance (longer routes are less safe)
    const distance = this.calculateDistance(start.lat, start.lon, end.lat, end.lon);
    score -= Math.min(distance / 10, 20);
    
    // Random factors (road conditions, infrastructure)
    score -= Math.random() * 20;
    
    // Check for blocked roads (simulated)
    if (this.blockedRoads.size > 0) {
      score -= this.blockedRoads.size * 5;
    }
    
    return Math.max(Math.floor(score), 30);
  }

  private determineRouteStatus(estimatedTime: number): 'clear' | 'congested' | 'blocked' {
    if (estimatedTime < 30) return 'clear';
    if (estimatedTime < 60) return 'congested';
    if (Math.random() > 0.9) return 'blocked';
    return 'congested';
  }

  private updateSafeZoneDistances(disasterLocation: { lat: number; lon: number }): void {
    for (const zone of this.safeZones) {
      zone.distanceFromDisaster = this.calculateDistance(
        disasterLocation.lat,
        disasterLocation.lon,
        zone.location.lat,
        zone.location.lon
      );
    }
  }

  private getNearestSafeZones(location: { lat: number; lon: number }, count: number): SafeZone[] {
    return this.safeZones
      .filter(zone => zone.currentOccupancy < zone.capacity)
      .sort((a, b) => a.distanceFromDisaster - b.distanceFromDisaster)
      .slice(0, count);
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

  private updateTrafficConditions(): void {
    // Simulate traffic condition updates
    for (const [disasterId, routes] of this.evacuationRoutes) {
      for (const route of routes) {
        // Random traffic changes
        if (Math.random() > 0.8) {
          const statuses: Array<'clear' | 'congested' | 'blocked'> = ['clear', 'congested', 'blocked'];
          route.status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Adjust time based on new status
          switch (route.status) {
            case 'clear':
              route.estimatedTime = Math.floor(route.distance / 60 * 60);
              break;
            case 'congested':
              route.estimatedTime = Math.floor(route.distance / 40 * 60);
              break;
            case 'blocked':
              route.estimatedTime = Infinity;
              break;
          }
        }
      }
    }
  }

  private optimizeRoutes(): void {
    // Optimize existing routes based on current conditions
    for (const [disasterId, routes] of this.evacuationRoutes) {
      routes.sort((a, b) => {
        // Prioritize by safety score and time
        const scoreA = a.safetyScore / a.estimatedTime;
        const scoreB = b.safetyScore / b.estimatedTime;
        return scoreB - scoreA;
      });
    }
  }

  private updateSafeZoneStatus(): void {
    // Simulate safe zone occupancy changes
    for (const zone of this.safeZones) {
      if (Math.random() > 0.9) {
        // Increase occupancy
        zone.currentOccupancy = Math.min(
          zone.currentOccupancy + Math.floor(Math.random() * 100),
          zone.capacity
        );
      } else if (Math.random() < 0.1) {
        // Decrease occupancy (people leaving)
        zone.currentOccupancy = Math.max(
          zone.currentOccupancy - Math.floor(Math.random() * 50),
          0
        );
      }
    }
  }

  private calculateSpecificRoute(data: any): void {
    const route = this.calculateRoute(data.start, data.end, data.disasterId || 'manual');
    this.sendMessage(data.requester, 'route_calculated', route);
  }

  private blockRoad(roadId: string): void {
    this.blockedRoads.add(roadId);
    this.logActivity('Road blocked', { roadId });
    
    // Recalculate affected routes
    this.optimizeRoutes();
  }

  private updateTrafficData(data: any): void {
    for (const [roadId, congestion] of Object.entries(data.traffic)) {
      this.trafficData.set(roadId, congestion as number);
    }
  }

  private provideSafeZones(requester: string, data: any): void {
    const availableZones = this.safeZones.filter(z => z.currentOccupancy < z.capacity);
    this.sendMessage(requester, 'safe_zones_response', availableZones);
  }

  private provideRoutes(requester: string, data: any): void {
    const routes = this.evacuationRoutes.get(data.disasterId);
    if (routes) {
      this.sendMessage(requester, 'routes_response', routes);
    }
  }

  protected cleanup(): void {
    this.evacuationRoutes.clear();
    this.blockedRoads.clear();
    this.trafficData.clear();
    // Reset safe zone occupancy
    for (const zone of this.safeZones) {
      zone.currentOccupancy = 0;
    }
  }

  protected getProcessingInterval(): number {
    return 45000; // Process every 45 seconds
  }
}