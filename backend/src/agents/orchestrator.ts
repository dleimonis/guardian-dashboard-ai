import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { WebSocketManager } from '../services/websocket';
import { BaseAgent } from './base-agent';
import { FireWatcherAgent } from './detection/fire-watcher';
import { QuakeDetectorAgent } from './detection/quake-detector';
import { WeatherTrackerAgent } from './detection/weather-tracker';
import { FloodMonitorAgent } from './detection/flood-monitor';
import { CommunityReporter } from './detection/community-reporter';
import { ThreatAnalyzerAgent } from './analysis/threat-analyzer';
import { ImpactPredictorAgent } from './analysis/impact-predictor';
import { RouteCalculatorAgent } from './analysis/route-calculator';
import { PriorityManagerAgent } from './analysis/priority-manager';
import { AlertDispatcherAgent } from './action/alert-dispatcher';
import { NotificationManagerAgent } from './action/notification-manager';
import { StatusReporterAgent } from './action/status-reporter';
import { recordDisasterEvent } from '../routes/analytics';

export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface DisasterEvent {
  id: string;
  type: 'fire' | 'earthquake' | 'weather' | 'flood' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lon: number;
    name?: string;
    radius?: number;
  };
  data: any;
  timestamp: string;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private logger: Logger;
  private wsManager: WebSocketManager;
  private isRunning: boolean = false;
  private messageQueue: AgentMessage[] = [];
  private messageProcessingInterval: NodeJS.Timeout | null = null;

  constructor(logger: Logger, wsManager: WebSocketManager) {
    super();
    this.logger = logger;
    this.wsManager = wsManager;
  }

  public async initialize() {
    this.logger.info('Initializing Agent Orchestrator...');

    // Initialize Detection Squad
    this.registerAgent(new FireWatcherAgent(this.logger, this));
    this.registerAgent(new QuakeDetectorAgent(this.logger, this));
    this.registerAgent(new WeatherTrackerAgent(this.logger, this));
    this.registerAgent(new FloodMonitorAgent(this.logger, this));
    this.registerAgent(new CommunityReporter());

    // Initialize Analysis Squad
    this.registerAgent(new ThreatAnalyzerAgent(this.logger, this));
    this.registerAgent(new ImpactPredictorAgent(this.logger, this));
    this.registerAgent(new RouteCalculatorAgent(this.logger, this));
    this.registerAgent(new PriorityManagerAgent(this.logger, this));

    // Initialize Action Squad
    this.registerAgent(new AlertDispatcherAgent(this.logger, this));
    this.registerAgent(new NotificationManagerAgent(this.logger, this));
    this.registerAgent(new StatusReporterAgent(this.logger, this));

    // Start all agents
    await this.startAllAgents();

    // Start message processing
    this.startMessageProcessing();

    this.logger.info('Agent Orchestrator initialized successfully');
  }

  private registerAgent(agent: BaseAgent) {
    this.agents.set(agent.getName(), agent);
    
    // Subscribe to agent events
    agent.on('status_change', (status) => {
      this.handleAgentStatusChange(agent.getName(), status);
    });

    agent.on('disaster_detected', (event: DisasterEvent) => {
      this.handleDisasterDetection(event);
    });

    agent.on('analysis_complete', (analysis) => {
      this.handleAnalysisComplete(analysis);
    });

    agent.on('action_taken', (action) => {
      this.handleActionTaken(action);
    });

    this.logger.info(`Agent registered: ${agent.getName()}`);
  }

  private async startAllAgents() {
    this.isRunning = true;
    
    for (const [name, agent] of this.agents) {
      try {
        await agent.start();
        this.logger.info(`Agent started: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to start agent ${name}:`, error);
      }
    }
  }

  private startMessageProcessing() {
    this.messageProcessingInterval = setInterval(() => {
      try {
        this.processMessageQueue();
      } catch (error) {
        this.logger.error('Error processing message queue:', error);
      }
    }, 100);
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && typeof message === 'object') {
        try {
          this.deliverMessage(message);
        } catch (error) {
          this.logger.error('Error delivering message:', { error, message });
        }
      }
    }
  }

  private deliverMessage(message: AgentMessage) {
    // Validate message structure
    if (!message || !message.to) {
      this.logger.warn('Invalid message structure:', message);
      return;
    }

    const targetAgent = this.agents.get(message.to);
    
    if (targetAgent) {
      try {
        targetAgent.receiveMessage(message);
        this.logger.debug(`Message delivered from ${message.from} to ${message.to}`);
      } catch (error) {
        this.logger.error(`Error delivering message to ${message.to}:`, error);
      }
    } else {
      this.logger.warn(`Target agent not found: ${message.to}`);
    }
  }

  public sendMessage(message: AgentMessage) {
    this.messageQueue.push(message);
  }

  public broadcastMessage(from: string, type: string, data: any) {
    this.agents.forEach((agent, name) => {
      if (name !== from) {
        this.sendMessage({
          from,
          to: name,
          type,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  private handleAgentStatusChange(agentName: string, status: any) {
    this.logger.info(`Agent ${agentName} status changed:`, status);
    
    // Broadcast status update via WebSocket
    this.wsManager.broadcastAgentStatus({
      agent: agentName,
      status: status.status,
      message: status.message,
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisasterDetection(event: DisasterEvent) {
    this.logger.warn(`Disaster detected:`, event);
    
    // Record for analytics
    recordDisasterEvent(event);
    
    // Send to analysis squad
    this.sendMessage({
      from: 'orchestrator',
      to: 'ThreatAnalyzer',
      type: 'analyze_threat',
      data: event,
      timestamp: new Date().toISOString(),
    });

    this.sendMessage({
      from: 'orchestrator',
      to: 'ImpactPredictor',
      type: 'predict_impact',
      data: event,
      timestamp: new Date().toISOString(),
    });

    // Broadcast via WebSocket
    this.wsManager.broadcastDisasterUpdate(event);
  }

  private handleAnalysisComplete(analysis: any) {
    this.logger.info('Analysis complete:', analysis);
    
    // Send to action squad based on analysis
    if (analysis.requiresAlert) {
      this.sendMessage({
        from: 'orchestrator',
        to: 'AlertDispatcher',
        type: 'dispatch_alert',
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    }

    if (analysis.requiresNotification) {
      this.sendMessage({
        from: 'orchestrator',
        to: 'NotificationManager',
        type: 'send_notifications',
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    }

    // Always update status
    this.sendMessage({
      from: 'orchestrator',
      to: 'StatusReporter',
      type: 'update_status',
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  }

  private handleActionTaken(action: any) {
    this.logger.info('Action taken:', action);
    
    // Broadcast action result via WebSocket
    this.wsManager.broadcastAlert({
      type: 'action_taken',
      action: action.type,
      result: action.result,
      timestamp: new Date().toISOString(),
    });
  }

  public getAgentStatus(agentName: string) {
    const agent = this.agents.get(agentName);
    return agent ? agent.getStatus() : null;
  }

  public getAllAgentStatuses() {
    const statuses: any = {};
    
    this.agents.forEach((agent, name) => {
      statuses[name] = agent.getStatus();
    });
    
    return statuses;
  }

  public async runSimulation(scenario: any) {
    this.logger.info('Running disaster simulation:', scenario);
    
    // Validate scenario input
    if (!scenario || !scenario.type || !scenario.severity || !scenario.location) {
      this.logger.error('Invalid simulation scenario:', scenario);
      return {
        status: 'error',
        message: 'Invalid simulation scenario',
      };
    }
    
    // Create simulated disaster event with validation
    const simulatedEvent: DisasterEvent = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: scenario.type || 'other',
      severity: scenario.severity || 'medium',
      location: {
        lat: scenario.location?.lat || 0,
        lon: scenario.location?.lon || 0,
        name: scenario.location?.name || 'Unknown Location',
        radius: scenario.location?.radius || 50,
      },
      data: {
        ...(scenario.data || {}),
        isSimulation: true,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      // Trigger disaster detection flow
      this.handleDisasterDetection(simulatedEvent);

      return {
        simulationId: simulatedEvent.id,
        status: 'running',
        message: 'Simulation started successfully',
      };
    } catch (error) {
      this.logger.error('Error running simulation:', error);
      return {
        status: 'error',
        message: 'Failed to run simulation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public shutdown() {
    this.logger.info('Shutting down Agent Orchestrator...');
    this.isRunning = false;

    // Clear the message processing interval
    if (this.messageProcessingInterval) {
      clearInterval(this.messageProcessingInterval);
      this.messageProcessingInterval = null;
    }

    // Stop all agents
    this.agents.forEach((agent, name) => {
      try {
        agent.stop();
        this.logger.info(`Agent stopped: ${name}`);
      } catch (error) {
        this.logger.error(`Error stopping agent ${name}:`, error);
      }
    });

    this.agents.clear();
    this.messageQueue = [];
    this.logger.info('Agent Orchestrator shut down');
  }
}