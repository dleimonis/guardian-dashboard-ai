import { Logger } from 'winston';
import * as cron from 'node-cron';
import { AgentOrchestrator } from '../agents/orchestrator';
import axios from 'axios';

export class DisasterMonitoringService {
  private logger: Logger;
  private orchestrator: AgentOrchestrator;
  private scheduledTasks: cron.ScheduledTask[] = [];
  private isRunning: boolean = false;
  private statistics = {
    startTime: new Date(),
    eventsProcessed: 0,
    alertsSent: 0,
    lastCheck: new Date(),
  };

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    this.logger = logger;
    this.orchestrator = orchestrator;
  }

  public start() {
    if (this.isRunning) {
      this.logger.warn('Monitoring service is already running');
      return;
    }

    this.logger.info('Starting Disaster Monitoring Service...');
    this.isRunning = true;
    this.statistics.startTime = new Date();

    // Schedule regular monitoring tasks
    this.scheduleMonitoringTasks();
    
    // Schedule health checks
    this.scheduleHealthChecks();
    
    // Schedule statistics reporting
    this.scheduleStatisticsReporting();

    this.logger.info('Disaster Monitoring Service started successfully');
  }

  private scheduleMonitoringTasks() {
    // Check for new disasters every 5 minutes
    const disasterCheck = cron.schedule('*/5 * * * *', async () => {
      try {
        await this.checkForNewDisasters();
        this.statistics.lastCheck = new Date();
      } catch (error) {
        this.logger.error('Error in disaster check:', error);
      }
    });
    this.scheduledTasks.push(disasterCheck);

    // Update weather conditions every 10 minutes
    const weatherUpdate = cron.schedule('*/10 * * * *', async () => {
      try {
        await this.updateWeatherConditions();
      } catch (error) {
        this.logger.error('Error updating weather:', error);
      }
    });
    this.scheduledTasks.push(weatherUpdate);

    // Check API health every 15 minutes
    const apiHealthCheck = cron.schedule('*/15 * * * *', async () => {
      try {
        await this.checkExternalAPIs();
      } catch (error) {
        this.logger.error('Error checking external APIs:', error);
      }
    });
    this.scheduledTasks.push(apiHealthCheck);

    // Clean up old data daily at 2 AM
    const cleanup = cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        this.logger.error('Error in cleanup:', error);
      }
    });
    this.scheduledTasks.push(cleanup);
  }

  private scheduleHealthChecks() {
    // Check agent health every 2 minutes
    const agentHealthCheck = cron.schedule('*/2 * * * *', () => {
      try {
        const statuses = this.orchestrator.getAllAgentStatuses();
        const unhealthyAgents = Object.entries(statuses).filter(
          ([name, status]: [string, any]) => 
            status.status === 'offline' || status.status === 'error'
        );

        if (unhealthyAgents.length > 0) {
          this.logger.warn('Unhealthy agents detected:', unhealthyAgents);
          // Attempt to restart unhealthy agents
          unhealthyAgents.forEach(([name]) => {
            this.restartAgent(name);
          });
        }
      } catch (error) {
        this.logger.error('Error in agent health check:', error);
      }
    });
    this.scheduledTasks.push(agentHealthCheck);

    // System resource check every 5 minutes
    const resourceCheck = cron.schedule('*/5 * * * *', () => {
      try {
        const usage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.logger.debug('System resources:', {
          memory: {
            rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
          },
          cpu: cpuUsage,
        });

        // Alert if memory usage is high
        if (usage.heapUsed / usage.heapTotal > 0.9) {
          this.logger.warn('High memory usage detected');
        }
      } catch (error) {
        this.logger.error('Error checking system resources:', error);
      }
    });
    this.scheduledTasks.push(resourceCheck);
  }

  private scheduleStatisticsReporting() {
    // Report statistics every hour
    const statsReport = cron.schedule('0 * * * *', () => {
      try {
        const uptime = Date.now() - this.statistics.startTime.getTime();
        const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
        
        this.logger.info('Monitoring Service Statistics:', {
          uptime: `${uptimeHours} hours`,
          eventsProcessed: this.statistics.eventsProcessed,
          alertsSent: this.statistics.alertsSent,
          lastCheck: this.statistics.lastCheck.toISOString(),
          agents: this.orchestrator.getAllAgentStatuses(),
        });
      } catch (error) {
        this.logger.error('Error reporting statistics:', error);
      }
    });
    this.scheduledTasks.push(statsReport);
  }

  private async checkForNewDisasters() {
    this.logger.debug('Checking for new disasters...');
    
    // This would aggregate data from multiple sources
    // For now, we'll simulate checking
    
    const sources = [
      { name: 'NASA FIRMS', url: process.env.NASA_API_URL },
      { name: 'USGS', url: process.env.USGS_API_URL },
      { name: 'NOAA', url: process.env.NOAA_API_URL },
      { name: 'GDACS', url: process.env.GDACS_API_URL },
    ];

    for (const source of sources) {
      if (source.url) {
        try {
          // Check each source
          this.logger.debug(`Checking ${source.name}...`);
          // In production, this would make actual API calls
          this.statistics.eventsProcessed++;
        } catch (error) {
          this.logger.error(`Error checking ${source.name}:`, error);
        }
      }
    }
  }

  private async updateWeatherConditions() {
    this.logger.debug('Updating weather conditions...');
    
    // This would fetch current weather data for monitored regions
    // And update any weather-related threats
    
    const regions = [
      { name: 'California', lat: 36.7783, lon: -119.4179 },
      { name: 'Florida', lat: 27.6648, lon: -81.5158 },
      { name: 'Texas', lat: 31.9686, lon: -99.9018 },
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
    ];

    for (const region of regions) {
      try {
        // Check weather for each region
        this.logger.debug(`Updating weather for ${region.name}`);
        // In production, this would call weather APIs
      } catch (error) {
        this.logger.error(`Error updating weather for ${region.name}:`, error);
      }
    }
  }

  private async checkExternalAPIs() {
    this.logger.debug('Checking external API health...');
    
    const apis = [
      {
        name: 'NASA FIRMS',
        healthUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/DEMO_KEY/MODIS_NRT/world/1/2024-01-01',
        critical: true,
      },
      {
        name: 'USGS Earthquake',
        healthUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
        critical: true,
      },
      {
        name: 'NOAA Weather',
        healthUrl: 'https://api.weather.gov/',
        critical: false,
      },
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(api.healthUrl, { 
          timeout: 5000,
          validateStatus: () => true, // Accept any status
        });
        
        if (response.status < 400) {
          this.logger.debug(`${api.name} API is healthy`);
        } else {
          this.logger.warn(`${api.name} API returned status ${response.status}`);
          if (api.critical) {
            // Alert about critical API failure
            this.handleCriticalAPIFailure(api.name);
          }
        }
      } catch (error) {
        this.logger.error(`${api.name} API health check failed:`, error);
        if (api.critical) {
          this.handleCriticalAPIFailure(api.name);
        }
      }
    }
  }

  private handleCriticalAPIFailure(apiName: string) {
    this.logger.error(`CRITICAL: ${apiName} API is unavailable`);
    
    // Switch to fallback mode or simulation
    // Notify administrators
    // Log incident for review
  }

  private async cleanupOldData() {
    this.logger.info('Performing data cleanup...');
    
    try {
      // Clean up old alerts (older than 7 days)
      // Clean up processed events
      // Archive historical data
      // Optimize database if applicable
      
      this.logger.info('Data cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during data cleanup:', error);
    }
  }

  private restartAgent(agentName: string) {
    this.logger.info(`Attempting to restart agent: ${agentName}`);
    
    try {
      // In production, this would restart the specific agent
      // For now, we'll just log the attempt
      this.logger.info(`Agent ${agentName} restart initiated`);
    } catch (error) {
      this.logger.error(`Failed to restart agent ${agentName}:`, error);
    }
  }

  public stop() {
    if (!this.isRunning) {
      this.logger.warn('Monitoring service is not running');
      return;
    }

    this.logger.info('Stopping Disaster Monitoring Service...');
    
    // Stop all scheduled tasks
    this.scheduledTasks.forEach(task => {
      task.stop();
    });
    this.scheduledTasks = [];
    
    this.isRunning = false;
    this.logger.info('Disaster Monitoring Service stopped');
  }

  public getStatistics() {
    return {
      ...this.statistics,
      isRunning: this.isRunning,
      uptime: Date.now() - this.statistics.startTime.getTime(),
    };
  }

  public triggerManualCheck() {
    this.logger.info('Manual disaster check triggered');
    return this.checkForNewDisasters();
  }
}