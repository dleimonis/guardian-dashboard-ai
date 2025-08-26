import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from './orchestrator';

export interface AgentStatus {
  status: 'online' | 'warning' | 'offline' | 'error';
  message?: string;
  lastActivity?: string;
  metrics?: any;
}

export abstract class BaseAgent extends EventEmitter {
  protected name: string;
  protected description: string;
  protected logger: Logger;
  protected orchestrator: AgentOrchestrator;
  protected status: AgentStatus;
  protected isRunning: boolean = false;
  protected processInterval?: NodeJS.Timeout;

  constructor(
    name: string,
    description: string,
    logger: Logger,
    orchestrator: AgentOrchestrator
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

  public async start() {
    if (this.isRunning) {
      this.logger.warn(`Agent ${this.name} is already running`);
      return;
    }

    this.logger.info(`Starting agent: ${this.name}`);
    this.isRunning = true;

    try {
      await this.initialize();
      
      this.updateStatus({
        status: 'online',
        message: 'Agent started successfully',
      });

      // Start the main processing loop
      this.startProcessing();
    } catch (error) {
      this.logger.error(`Failed to start agent ${this.name}:`, error);
      this.updateStatus({
        status: 'error',
        message: `Start failed: ${error}`,
      });
      throw error;
    }
  }

  public stop() {
    if (!this.isRunning) {
      this.logger.warn(`Agent ${this.name} is not running`);
      return;
    }

    this.logger.info(`Stopping agent: ${this.name}`);
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = undefined;
    }

    this.cleanup();

    this.updateStatus({
      status: 'offline',
      message: 'Agent stopped',
    });
  }

  protected startProcessing() {
    const intervalMs = this.getProcessingInterval();
    
    this.processInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.process();
        } catch (error) {
          this.logger.error(`Processing error in agent ${this.name}:`, error);
          this.updateStatus({
            status: 'warning',
            message: `Processing error: ${error}`,
          });
        }
      }
    }, intervalMs);
  }

  public receiveMessage(message: AgentMessage) {
    this.logger.debug(`${this.name} received message from ${message.from}:`, message);
    
    try {
      this.handleMessage(message);
    } catch (error) {
      this.logger.error(`Error handling message in ${this.name}:`, error);
    }
  }

  protected sendMessage(to: string, type: string, data: any) {
    this.orchestrator.sendMessage({
      from: this.name,
      to,
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected broadcastMessage(type: string, data: any) {
    this.orchestrator.broadcastMessage(this.name, type, data);
  }

  protected logActivity(activity: string, data?: any) {
    this.logger.info(`[${this.name}] ${activity}`, data || '');
    this.status.lastActivity = new Date().toISOString();
  }

  // Abstract methods to be implemented by subclasses
  protected abstract initialize(): Promise<void>;
  protected abstract process(): Promise<void>;
  protected abstract handleMessage(message: AgentMessage): void;
  protected abstract cleanup(): void;
  protected abstract getProcessingInterval(): number;
}