/**
 * Demo Mode Configuration
 * 
 * For MCP Hackathon compliance, the application works in demo mode
 * without requiring external API keys. This ensures judges can test
 * the full functionality without needing to configure API credentials.
 */

export const DemoConfig = {
  // Enable demo mode when no API keys are configured
  enabled: !process.env.DESCOPE_MANAGEMENT_KEY || process.env.NODE_ENV === 'demo',
  
  // Simulation intervals (in milliseconds)
  intervals: {
    fireDetection: 30000,      // Check for fires every 30 seconds
    earthquakeDetection: 45000, // Check for earthquakes every 45 seconds
    weatherTracking: 60000,     // Check weather every minute
    floodMonitoring: 90000,     // Check floods every 90 seconds
  },

  // Demo data generation settings
  dataGeneration: {
    // Generate random disasters periodically in demo mode
    autoGenerate: true,
    
    // Chance of generating a disaster on each check (0-1)
    disasterChance: 0.3,
    
    // Maximum simultaneous disasters
    maxActiveDisasters: 5,
    
    // Disaster types and their relative weights
    disasterTypes: {
      fire: 0.3,
      earthquake: 0.25,
      weather: 0.25,
      flood: 0.2,
    },
  },

  // Pre-configured demo disasters for consistent testing
  sampleDisasters: {
    fire: {
      type: 'fire',
      location: { lat: 34.0522, lon: -118.2437 }, // Los Angeles
      severity: 'high',
      data: {
        confidence: 95,
        brightness: 450,
        frp: 250, // Fire Radiative Power
        acquisition_time: new Date().toISOString(),
        satellite: 'MODIS',
      },
    },
    earthquake: {
      type: 'earthquake',
      location: { lat: 37.7749, lon: -122.4194 }, // San Francisco
      severity: 'critical',
      data: {
        magnitude: 6.8,
        depth: 10,
        tsunami: true,
        place: 'San Francisco Bay Area',
        time: new Date().toISOString(),
      },
    },
    weather: {
      type: 'weather',
      location: { lat: 29.7604, lon: -95.3698 }, // Houston
      severity: 'high',
      data: {
        event: 'Hurricane',
        category: 4,
        windSpeed: 140,
        pressure: 940,
        stormSurge: 12,
      },
    },
    flood: {
      type: 'flood',
      location: { lat: 29.9511, lon: -90.0715 }, // New Orleans
      severity: 'medium',
      data: {
        waterLevel: 8.5,
        normalLevel: 3.0,
        rateOfRise: 0.5,
        affectedArea: 'Lower Ninth Ward',
      },
    },
  },

  // API responses for demo mode (mimics real API responses)
  mockApiResponses: {
    // NASA FIRMS response format
    firms: {
      success: true,
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
    
    // USGS response format
    usgs: {
      type: 'FeatureCollection',
      metadata: {
        generated: Date.now(),
        count: 0,
      },
      features: [],
    },
    
    // NOAA response format
    noaa: {
      features: [],
      title: 'Current Watches, Warnings and Advisories',
      updated: new Date().toISOString(),
    },
  },

  // Messages for demo mode
  messages: {
    welcome: 'Running in DEMO MODE - Perfect for hackathon testing!',
    noApiKeys: 'No external API keys required for demo functionality',
    simulationActive: 'Emergency simulation system is active',
    agentsReady: 'All 11 AI agents are operational in demo mode',
  },
};

/**
 * Get demo disaster data based on type
 */
export function getDemoDisaster(type: string) {
  const disasters = DemoConfig.sampleDisasters;
  return disasters[type as keyof typeof disasters] || disasters.fire;
}

/**
 * Generate random location within bounds
 */
export function getRandomLocation() {
  // Continental US bounds
  const bounds = {
    north: 49.0,
    south: 25.0,
    east: -66.0,
    west: -125.0,
  };
  
  return {
    lat: Math.random() * (bounds.north - bounds.south) + bounds.south,
    lon: Math.random() * (bounds.east - bounds.west) + bounds.west,
  };
}

/**
 * Generate random disaster severity
 */
export function getRandomSeverity(): 'low' | 'medium' | 'high' | 'critical' {
  const rand = Math.random();
  if (rand < 0.3) return 'low';
  if (rand < 0.6) return 'medium';
  if (rand < 0.85) return 'high';
  return 'critical';
}

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return DemoConfig.enabled;
}

/**
 * Log demo mode status
 */
export function logDemoStatus(logger: any) {
  if (isDemoMode()) {
    logger.info('================================================');
    logger.info('🎮 DEMO MODE ACTIVE - MCP HACKATHON READY! 🎮');
    logger.info('================================================');
    logger.info('✅ All features available without API keys');
    logger.info('✅ Simulated disaster data for testing');
    logger.info('✅ All 11 AI agents operational');
    logger.info('✅ Perfect for hackathon demonstration');
    logger.info('================================================');
  } else {
    logger.info('Production mode: Using real API connections');
  }
}