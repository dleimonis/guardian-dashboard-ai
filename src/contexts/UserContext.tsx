import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

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
    start: string;
    end: string;
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
  polygon: Array<[number, number]>;
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

interface UserContextType {
  user: User | null;
  locations: UserLocation[];
  preferences: UserPreferences | null;
  alertZones: AlertZone[];
  isLoading: boolean;
  
  // User operations
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Location operations
  addLocation: (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  setDefaultLocation: (locationId: string) => Promise<void>;
  
  // Preferences operations
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Alert zone operations
  createAlertZone: (zone: Omit<AlertZone, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAlertZone: (zoneId: string, updates: Partial<AlertZone>) => Promise<void>;
  deleteAlertZone: (zoneId: string) => Promise<void>;
  testAlertZone: (zoneId: string) => Promise<any>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [alertZones, setAlertZones] = useState<AlertZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile on mount
  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, locationsRes, prefsRes, zonesRes] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getUserLocations(),
        apiService.getUserPreferences(),
        apiService.getUserAlertZones(),
      ]);
      
      setUser(profileRes);
      setLocations(locationsRes);
      setPreferences(prefsRes);
      setAlertZones(zonesRes);
      
      // Cache in localStorage for offline access
      localStorage.setItem('user_profile', JSON.stringify(profileRes));
      localStorage.setItem('user_preferences', JSON.stringify(prefsRes));
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Try to load from cache
      const cachedProfile = localStorage.getItem('user_profile');
      const cachedPrefs = localStorage.getItem('user_preferences');
      
      if (cachedProfile) {
        setUser(JSON.parse(cachedProfile));
      }
      if (cachedPrefs) {
        setPreferences(JSON.parse(cachedPrefs));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // User operations
  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateUserProfile(updates);
      setUser(updatedUser);
      localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Location operations
  const addLocation = async (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const newLocation = await apiService.addUserLocation(location);
      setLocations(prev => [...prev, newLocation]);
      
      toast({
        title: 'Location Added',
        description: `${location.name} has been added to your saved locations.`,
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: 'Failed to Add Location',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteLocation = async (locationId: string) => {
    try {
      await apiService.deleteUserLocation(locationId);
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      
      toast({
        title: 'Location Removed',
        description: 'The location has been removed from your saved locations.',
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Failed to Remove Location',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const setDefaultLocation = async (locationId: string) => {
    try {
      // Update all locations to set the new default
      const updatedLocations = locations.map(loc => ({
        ...loc,
        isDefault: loc.id === locationId,
      }));
      
      // Find the location to update
      const locationToUpdate = updatedLocations.find(loc => loc.id === locationId);
      if (locationToUpdate) {
        await apiService.updateUserLocation(locationId, { isDefault: true });
        setLocations(updatedLocations);
        
        toast({
          title: 'Default Location Set',
          description: `${locationToUpdate.name} is now your default location.`,
        });
      }
    } catch (error) {
      console.error('Error setting default location:', error);
      toast({
        title: 'Failed to Set Default',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Preferences operations
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updatedPrefs = await apiService.updateUserPreferences(updates);
      setPreferences(updatedPrefs);
      localStorage.setItem('user_preferences', JSON.stringify(updatedPrefs));
      
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Failed to Update Preferences',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Alert zone operations
  const createAlertZone = async (zone: Omit<AlertZone, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newZone = await apiService.createAlertZone(zone);
      setAlertZones(prev => [...prev, newZone]);
      
      toast({
        title: 'Alert Zone Created',
        description: `${zone.name} has been added to your alert zones.`,
      });
    } catch (error) {
      console.error('Error creating alert zone:', error);
      toast({
        title: 'Failed to Create Zone',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateAlertZone = async (zoneId: string, updates: Partial<AlertZone>) => {
    try {
      const updatedZone = await apiService.updateAlertZone(zoneId, updates);
      setAlertZones(prev => prev.map(zone => 
        zone.id === zoneId ? updatedZone : zone
      ));
      
      toast({
        title: 'Alert Zone Updated',
        description: 'Your alert zone has been updated.',
      });
    } catch (error) {
      console.error('Error updating alert zone:', error);
      toast({
        title: 'Failed to Update Zone',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteAlertZone = async (zoneId: string) => {
    try {
      await apiService.deleteAlertZone(zoneId);
      setAlertZones(prev => prev.filter(zone => zone.id !== zoneId));
      
      toast({
        title: 'Alert Zone Deleted',
        description: 'The alert zone has been removed.',
      });
    } catch (error) {
      console.error('Error deleting alert zone:', error);
      toast({
        title: 'Failed to Delete Zone',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const testAlertZone = async (zoneId: string) => {
    try {
      const result = await apiService.testAlertZone(zoneId);
      
      toast({
        title: 'Zone Test Complete',
        description: result.testResult.message,
      });
      
      return result;
    } catch (error) {
      console.error('Error testing alert zone:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test the alert zone.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const value: UserContextType = {
    user,
    locations,
    preferences,
    alertZones,
    isLoading,
    updateProfile,
    refreshProfile,
    addLocation,
    deleteLocation,
    setDefaultLocation,
    updatePreferences,
    createAlertZone,
    updateAlertZone,
    deleteAlertZone,
    testAlertZone,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};