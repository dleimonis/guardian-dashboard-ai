import { EventEmitter } from 'events';
import { Logger } from 'winston';

export interface AgentStatus {
  status: 'online' | 'warning' | 'offline' | 'error';
  message?: string;
  lastActivity?: string;
  metrics?: any;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  data: any;
  timestamp: string;
}

export abstract class BaseAgent extends EventEmitter {
  protected name: string;
  protected description: string;
  protected logger: Logger;
  protected orchestrator: any; // Avoid circular dependency
  protected status: AgentStatus;
  protected isRunning: boolean = false;
  protected processInterval?: NodeJS.Timeout;
  protected activityLog: string[] = [];

  constructor(
    name: string,
    description: string,
    logger: Logger,
    orchestrator: any
  ) {
    super();
    this.name = name;
    this.description = description;
    this.logger = logger;
    this.orchestrator = orchestrator;
    this.status = {
      status: 'offline',
      message: 'Agent not started',
    };
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  protected updateStatus(status: AgentStatus) {
    this.status = {
      ...status,
      lastActivity: new Date().toISOString(),
    };
    this.emit('status_change', this.status);
  }

  protected logActivity(activity: string, data?: any) {
    const entry = `[${new Date().toISOString()}] ${activity}`;
    this.activityLog.push(entry);
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }
    this.logger.info(`[${this.name}] ${activity}`, data);
  }

  protected sendMessage(to: string, type: string, data: any) {
    const message: AgentMessage = {
      from: this.name,
      to,
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.orchestrator.sendMessage(message);
  }

  public receiveMessage(message: AgentMessage) {
    this.handleMessage(message);
  }

  protected abstract handleMessage(message: AgentMessage): void;
  protected abstract initialize(): Promise<void>;
  protected abstract process(): Promise<void>;
  protected abstract cleanup(): void;
  protected abstract getProcessingInterval(): number;

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(`Agent ${this.name} is already running`);
      return;
    }

    try {
      this.logger.info(`Starting agent: ${this.name}`);
      await this.initialize();
      this.isRunning = true;
      
      this.updateStatus({
        status: 'online',
        message: 'Agent running',
      });

      // Start processing loop
      this.processInterval = setInterval(async () => {
        try {
          await this.process();
        } catch (error) {
          this.logger.error(`Error in ${this.name} processing:`, error);
          this.updateStatus({
            status: 'warning',
            message: 'Processing error',
          });
        }
      }, this.getProcessingInterval());

      this.logActivity('Agent started');
    } catch (error) {
      this.logger.error(`Failed to start agent ${this.name}:`, error);
      this.updateStatus({
        status: 'error',
        message: 'Failed to start',
      });
      throw error;
    }
  }

  public stop(): void {
    if (!this.isRunning) {
      this.logger.warn(`Agent ${this.name} is not running`);
      return;
    }

    this.logger.info(`Stopping agent: ${this.name}`);
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = undefined;
    }

    this.cleanup();
    this.isRunning = false;
    
    this.updateStatus({
      status: 'offline',
      message: 'Agent stopped',
    });

    this.logActivity('Agent stopped');
  }

  public getActivityLog(): string[] {
    return this.activityLog;
  }
}