// Minimal demo API for Lovable deployment
// This provides basic functionality for the hackathon demo

const disasters = [
  {
    id: '1',
    type: 'earthquake',
    location: { lat: 37.7749, lon: -122.4194 },
    severity: 'high',
    magnitude: 6.5,
    place: 'San Francisco Bay Area',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'fire',
    location: { lat: 34.0522, lon: -118.2437 },
    severity: 'critical',
    confidence: 95,
    area: 'Los Angeles County',
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    type: 'weather',
    location: { lat: 29.7604, lon: -95.3698 },
    severity: 'high',
    event: 'Hurricane',
    category: 4,
    place: 'Houston, TX',
    timestamp: new Date().toISOString()
  }
];

const agents = [
  // Detection Squad
  { id: 'fire-watcher', name: 'FireWatcher', status: 'online', squad: 'detection', lastActivity: new Date() },
  { id: 'quake-detector', name: 'QuakeDetector', status: 'online', squad: 'detection', lastActivity: new Date() },
  { id: 'weather-tracker', name: 'WeatherTracker', status: 'online', squad: 'detection', lastActivity: new Date() },
  { id: 'flood-monitor', name: 'FloodMonitor', status: 'online', squad: 'detection', lastActivity: new Date() },
  // Analysis Squad
  { id: 'threat-analyzer', name: 'ThreatAnalyzer', status: 'online', squad: 'analysis', lastActivity: new Date() },
  { id: 'impact-predictor', name: 'ImpactPredictor', status: 'online', squad: 'analysis', lastActivity: new Date() },
  { id: 'route-calculator', name: 'RouteCalculator', status: 'online', squad: 'analysis', lastActivity: new Date() },
  { id: 'priority-manager', name: 'PriorityManager', status: 'online', squad: 'analysis', lastActivity: new Date() },
  // Action Squad
  { id: 'alert-dispatcher', name: 'AlertDispatcher', status: 'online', squad: 'action', lastActivity: new Date() },
  { id: 'notification-manager', name: 'NotificationManager', status: 'online', squad: 'action', lastActivity: new Date() },
  { id: 'status-reporter', name: 'StatusReporter', status: 'online', squad: 'action', lastActivity: new Date() }
];

// Export demo data for API endpoints
export default {
  disasters,
  agents,
  alerts: [],
  statistics: {
    activeEmergencies: disasters.length,
    peopleWarned: 125000,
    responseTime: 1.2,
    systemStatus: 'online'
  }
};