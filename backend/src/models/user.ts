export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  profilePicture?: string;
}

export interface UserLocation {
  id: string;
  userId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  isDefault: boolean;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  alertSeverity: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  disasterTypes: {
    earthquake: boolean;
    fire: boolean;
    flood: boolean;
    weather: boolean;
    other: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    overrideForCritical: boolean;
  };
  language: string;
  timezone: string;
  units: 'metric' | 'imperial';
}

export interface AlertZone {
  id: string;
  userId: string;
  name: string;
  description?: string;
  polygon: Array<[number, number]>; // [lat, lon] pairs
  color: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
  notificationOverrides?: {
    severityThreshold?: 'critical' | 'high' | 'medium' | 'low';
    disasterTypes?: string[];
    customMessage?: string;
  };
  statistics?: {
    lastAlert?: string;
    totalAlerts: number;
    activeDisasters: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  userId: string;
  alertId: string;
  disasterId: string;
  type: string;
  severity: string;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  message: string;
  sentAt: string;
  acknowledgedAt?: string;
  dismissed: boolean;
  deliveryStatus: {
    email?: 'sent' | 'delivered' | 'failed';
    sms?: 'sent' | 'delivered' | 'failed';
    push?: 'sent' | 'delivered' | 'failed';
  };
}

// In-memory storage for demo (replace with database in production)
class UserStore {
  private users: Map<string, User> = new Map();
  private locations: Map<string, UserLocation[]> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private alertZones: Map<string, AlertZone[]> = new Map();
  private alertHistory: Map<string, AlertHistory[]> = new Map();

  constructor() {
    // Load from localStorage if available (for persistence in demo)
    if (typeof global !== 'undefined' && !(global as any).window) {
      // Backend - no localStorage
      this.initializeDemoData();
    }
  }

  private initializeDemoData() {
    // Create demo admin user
    const adminUser: User = {
      id: 'admin_001',
      email: 'admin@guardian.ai',
      name: 'Admin User',
      phone: '+1234567890',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    this.users.set(adminUser.id, adminUser);

    // Set default preferences
    const defaultPrefs: UserPreferences = {
      userId: adminUser.id,
      notifications: {
        email: true,
        sms: true,
        push: true,
        inApp: true,
      },
      alertSeverity: {
        critical: true,
        high: true,
        medium: true,
        low: false,
      },
      disasterTypes: {
        earthquake: true,
        fire: true,
        flood: true,
        weather: true,
        other: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        overrideForCritical: true,
      },
      language: 'en',
      timezone: 'America/New_York',
      units: 'imperial',
    };
    this.preferences.set(adminUser.id, defaultPrefs);
  }

  // User CRUD operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Location operations
  async addLocation(location: Omit<UserLocation, 'id' | 'createdAt'>): Promise<UserLocation> {
    const newLocation: UserLocation = {
      ...location,
      id: `loc_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const userLocations = this.locations.get(location.userId) || [];
    
    // If this is default, unset other defaults
    if (newLocation.isDefault) {
      userLocations.forEach(loc => loc.isDefault = false);
    }
    
    userLocations.push(newLocation);
    this.locations.set(location.userId, userLocations);
    return newLocation;
  }

  async getUserLocations(userId: string): Promise<UserLocation[]> {
    return this.locations.get(userId) || [];
  }

  async deleteLocation(userId: string, locationId: string): Promise<boolean> {
    const userLocations = this.locations.get(userId) || [];
    const filtered = userLocations.filter(loc => loc.id !== locationId);
    this.locations.set(userId, filtered);
    return filtered.length < userLocations.length;
  }

  // Preferences operations
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    return this.preferences.get(userId) || null;
  }

  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = {
      ...current,
      ...updates,
      userId, // Ensure userId doesn't change
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
      },
      alertSeverity: {
        critical: true,
        high: true,
        medium: true,
        low: false,
      },
      disasterTypes: {
        earthquake: true,
        fire: true,
        flood: true,
        weather: true,
        other: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        overrideForCritical: true,
      },
      language: 'en',
      timezone: 'America/New_York',
      units: 'metric',
    };
  }

  // Alert Zone operations
  async createAlertZone(zone: Omit<AlertZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertZone> {
    const newZone: AlertZone = {
      ...zone,
      id: `zone_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statistics: {
        totalAlerts: 0,
        activeDisasters: 0,
      },
    };
    
    const userZones = this.alertZones.get(zone.userId) || [];
    userZones.push(newZone);
    this.alertZones.set(zone.userId, userZones);
    return newZone;
  }

  async getUserAlertZones(userId: string): Promise<AlertZone[]> {
    return this.alertZones.get(userId) || [];
  }

  async updateAlertZone(userId: string, zoneId: string, updates: Partial<AlertZone>): Promise<AlertZone | null> {
    const userZones = this.alertZones.get(userId) || [];
    const zoneIndex = userZones.findIndex(z => z.id === zoneId);
    
    if (zoneIndex === -1) return null;
    
    userZones[zoneIndex] = {
      ...userZones[zoneIndex],
      ...updates,
      id: zoneId,
      userId,
      updatedAt: new Date().toISOString(),
    };
    
    this.alertZones.set(userId, userZones);
    return userZones[zoneIndex];
  }

  async deleteAlertZone(userId: string, zoneId: string): Promise<boolean> {
    const userZones = this.alertZones.get(userId) || [];
    const filtered = userZones.filter(z => z.id !== zoneId);
    this.alertZones.set(userId, filtered);
    return filtered.length < userZones.length;
  }

  // Alert History operations
  async addAlertHistory(alert: Omit<AlertHistory, 'id'>): Promise<AlertHistory> {
    const newAlert: AlertHistory = {
      ...alert,
      id: `alert_${Date.now()}`,
    };
    
    const userHistory = this.alertHistory.get(alert.userId) || [];
    userHistory.unshift(newAlert); // Add to beginning
    
    // Keep only last 100 alerts per user
    if (userHistory.length > 100) {
      userHistory.pop();
    }
    
    this.alertHistory.set(alert.userId, userHistory);
    return newAlert;
  }

  async getUserAlertHistory(userId: string, limit: number = 50): Promise<AlertHistory[]> {
    const history = this.alertHistory.get(userId) || [];
    return history.slice(0, limit);
  }

  async acknowledgeAlert(userId: string, alertId: string): Promise<boolean> {
    const userHistory = this.alertHistory.get(userId) || [];
    const alert = userHistory.find(a => a.id === alertId);
    
    if (alert && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date().toISOString();
      this.alertHistory.set(userId, userHistory);
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
export const userStore = new UserStore();