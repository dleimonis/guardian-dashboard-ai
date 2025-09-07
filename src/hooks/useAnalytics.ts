import { useMemo } from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Disaster } from '@/services/api';
import { subHours, startOfHour, format } from 'date-fns';

export interface DisasterTrend {
  time: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DisasterTypeCount {
  type: string;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  trends: DisasterTrend[];
  typeDistribution: DisasterTypeCount[];
  severityDistribution: SeverityDistribution[];
  totalDisasters: number;
  criticalCount: number;
  responseTime: number;
  affectedAreas: number;
}

export function useAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
  const { disasters, alerts, statistics } = useEmergency();

  const analytics = useMemo(() => {
    // Filter disasters based on time range
    const now = new Date();
    let hoursBack: number;
    
    switch (timeRange) {
      case '1h':
        hoursBack = 1;
        break;
      case '24h':
        hoursBack = 24;
        break;
      case '7d':
        hoursBack = 24 * 7;
        break;
      case '30d':
        hoursBack = 24 * 30;
        break;
      default:
        hoursBack = 24;
    }

    const cutoffTime = subHours(now, hoursBack);
    
    const recentDisasters = disasters.filter((d: Disaster) => {
      const disasterTime = new Date(d.timestamp);
      return disasterTime >= cutoffTime;
    });

    // Calculate hourly trends
    const trendMap = new Map<string, { count: number; severities: { [key: string]: number } }>();
    
    // Initialize hours
    for (let i = 0; i < Math.min(hoursBack, 24); i++) {
      const hour = startOfHour(subHours(now, i));
      const key = format(hour, 'HH:mm');
      trendMap.set(key, { 
        count: 0, 
        severities: { critical: 0, high: 0, medium: 0, low: 0 } 
      });
    }

    // Populate with disaster data
    recentDisasters.forEach((disaster: Disaster) => {
      const hour = startOfHour(new Date(disaster.timestamp));
      const key = format(hour, 'HH:mm');
      
      if (trendMap.has(key)) {
        const entry = trendMap.get(key)!;
        entry.count++;
        entry.severities[disaster.severity]++;
      }
    });

    const trends: DisasterTrend[] = Array.from(trendMap.entries())
      .map(([time, data]) => ({
        time,
        count: data.count,
        critical: data.severities.critical,
        high: data.severities.high,
        medium: data.severities.medium,
        low: data.severities.low,
      }))
      .reverse();

    // Calculate type distribution
    const typeCount = new Map<string, number>();
    recentDisasters.forEach((disaster: Disaster) => {
      const count = typeCount.get(disaster.type) || 0;
      typeCount.set(disaster.type, count + 1);
    });

    const totalCount = recentDisasters.length || 1;
    const typeDistribution: DisasterTypeCount[] = Array.from(typeCount.entries())
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: Math.round((count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate severity distribution
    const severityCount = new Map<string, number>();
    recentDisasters.forEach((disaster: Disaster) => {
      const count = severityCount.get(disaster.severity) || 0;
      severityCount.set(disaster.severity, count + 1);
    });

    const severityDistribution: SeverityDistribution[] = ['critical', 'high', 'medium', 'low']
      .map(severity => ({
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        count: severityCount.get(severity) || 0,
        percentage: Math.round(((severityCount.get(severity) || 0) / totalCount) * 100),
      }));

    // Calculate summary statistics
    const criticalCount = recentDisasters.filter(d => d.severity === 'critical').length;
    
    // Calculate unique affected areas
    const uniqueLocations = new Set(
      recentDisasters.map(d => `${Math.round(d.location.lat)},${Math.round(d.location.lon)}`)
    );

    return {
      trends,
      typeDistribution,
      severityDistribution,
      totalDisasters: recentDisasters.length,
      criticalCount,
      responseTime: statistics?.avgResponseTime || 15,
      affectedAreas: uniqueLocations.size,
    };
  }, [disasters, alerts, statistics, timeRange]);

  return analytics;
}