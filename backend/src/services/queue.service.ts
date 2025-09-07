import Bull, { Queue, Job } from 'bull';
import { Logger } from 'winston';
import { getRedisInstance } from '../config/redis';

export interface NotificationJob {
  type: 'sms' | 'email' | 'webhook';
  recipient: string;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface DisasterProcessingJob {
  disasterId: string;
  type: string;
  data: any;
}

export interface AgentTaskJob {
  agentName: string;
  task: string;
  data: any;
}

export class QueueService {
  private notificationQueue: Queue<NotificationJob>;
  private disasterQueue: Queue<DisasterProcessingJob>;
  private agentTaskQueue: Queue<AgentTaskJob>;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;

    const redisService = getRedisInstance();
    const redisClient = redisService.getQueueClient();
    const redisOptions = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
      },
    };

    // Initialize queues
    this.notificationQueue = new Bull<NotificationJob>('notifications', redisOptions);
    this.disasterQueue = new Bull<DisasterProcessingJob>('disasters', redisOptions);
    this.agentTaskQueue = new Bull<AgentTaskJob>('agent-tasks', redisOptions);

    this.setupQueueEventHandlers();
    this.logger.info('✅ Queue service initialized');
  }

  private setupQueueEventHandlers(): void {
    // Notification Queue Events
    this.notificationQueue.on('completed', (job: Job) => {
      this.logger.info(`Notification job ${job.id} completed`);
    });

    this.notificationQueue.on('failed', (job: Job, err: Error) => {
      this.logger.error(`Notification job ${job.id} failed:`, err);
    });

    this.notificationQueue.on('stalled', (job: Job) => {
      this.logger.warn(`Notification job ${job.id} stalled`);
    });

    // Disaster Queue Events
    this.disasterQueue.on('completed', (job: Job) => {
      this.logger.info(`Disaster job ${job.id} completed`);
    });

    this.disasterQueue.on('failed', (job: Job, err: Error) => {
      this.logger.error(`Disaster job ${job.id} failed:`, err);
    });

    // Agent Task Queue Events
    this.agentTaskQueue.on('completed', (job: Job) => {
      this.logger.info(`Agent task job ${job.id} completed`);
    });

    this.agentTaskQueue.on('failed', (job: Job, err: Error) => {
      this.logger.error(`Agent task job ${job.id} failed:`, err);
    });
  }

  // Notification Queue Methods
  async addNotificationJob(data: NotificationJob, priority?: number): Promise<Job<NotificationJob>> {
    const options = {
      priority: priority || 0,
      attempts: parseInt(process.env.QUEUE_MAX_RETRIES || '3'),
      backoff: {
        type: 'exponential' as const,
        delay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000'),
      },
      removeOnComplete: true,
      removeOnFail: false,
    };

    const job = await this.notificationQueue.add(data, options);
    this.logger.info(`Added notification job ${job.id} for ${data.type} to ${data.recipient}`);
    return job;
  }

  async processNotificationQueue(
    processor: (job: Job<NotificationJob>) => Promise<void>
  ): Promise<void> {
    const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5');
    this.notificationQueue.process(concurrency, processor);
    this.logger.info(`Processing notification queue with concurrency ${concurrency}`);
  }

  // Disaster Queue Methods
  async addDisasterJob(data: DisasterProcessingJob): Promise<Job<DisasterProcessingJob>> {
    const job = await this.disasterQueue.add(data, {
      priority: data.type === 'critical' ? 1 : 0,
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
    });
    this.logger.info(`Added disaster job ${job.id} for disaster ${data.disasterId}`);
    return job;
  }

  async processDisasterQueue(
    processor: (job: Job<DisasterProcessingJob>) => Promise<void>
  ): Promise<void> {
    this.disasterQueue.process(10, processor);
    this.logger.info('Processing disaster queue');
  }

  // Agent Task Queue Methods
  async addAgentTask(data: AgentTaskJob, delay?: number): Promise<Job<AgentTaskJob>> {
    const options = delay ? { delay } : {};
    const job = await this.agentTaskQueue.add(data, options);
    this.logger.info(`Added agent task ${job.id} for ${data.agentName}`);
    return job;
  }

  async processAgentTaskQueue(
    processor: (job: Job<AgentTaskJob>) => Promise<void>
  ): Promise<void> {
    this.agentTaskQueue.process(5, processor);
    this.logger.info('Processing agent task queue');
  }

  // Queue Management Methods
  async getQueueStats(queueName: 'notifications' | 'disasters' | 'agent-tasks') {
    let queue: Queue;
    switch (queueName) {
      case 'notifications':
        queue = this.notificationQueue;
        break;
      case 'disasters':
        queue = this.disasterQueue;
        break;
      case 'agent-tasks':
        queue = this.agentTaskQueue;
        break;
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  async getAllQueueStats() {
    const [notifications, disasters, agentTasks] = await Promise.all([
      this.getQueueStats('notifications'),
      this.getQueueStats('disasters'),
      this.getQueueStats('agent-tasks'),
    ]);

    return { notifications, disasters, agentTasks };
  }

  async clearQueue(queueName: 'notifications' | 'disasters' | 'agent-tasks'): Promise<void> {
    let queue: Queue;
    switch (queueName) {
      case 'notifications':
        queue = this.notificationQueue;
        break;
      case 'disasters':
        queue = this.disasterQueue;
        break;
      case 'agent-tasks':
        queue = this.agentTaskQueue;
        break;
    }

    await queue.empty();
    this.logger.info(`Cleared queue: ${queueName}`);
  }

  async pauseQueue(queueName: 'notifications' | 'disasters' | 'agent-tasks'): Promise<void> {
    let queue: Queue;
    switch (queueName) {
      case 'notifications':
        queue = this.notificationQueue;
        break;
      case 'disasters':
        queue = this.disasterQueue;
        break;
      case 'agent-tasks':
        queue = this.agentTaskQueue;
        break;
    }

    await queue.pause();
    this.logger.info(`Paused queue: ${queueName}`);
  }

  async resumeQueue(queueName: 'notifications' | 'disasters' | 'agent-tasks'): Promise<void> {
    let queue: Queue;
    switch (queueName) {
      case 'notifications':
        queue = this.notificationQueue;
        break;
      case 'disasters':
        queue = this.disasterQueue;
        break;
      case 'agent-tasks':
        queue = this.agentTaskQueue;
        break;
    }

    await queue.resume();
    this.logger.info(`Resumed queue: ${queueName}`);
  }

  // Get queue instances for advanced operations
  getNotificationQueue(): Queue<NotificationJob> {
    return this.notificationQueue;
  }

  getDisasterQueue(): Queue<DisasterProcessingJob> {
    return this.disasterQueue;
  }

  getAgentTaskQueue(): Queue<AgentTaskJob> {
    return this.agentTaskQueue;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    try {
      await Promise.all([
        this.notificationQueue.close(),
        this.disasterQueue.close(),
        this.agentTaskQueue.close(),
      ]);
      this.logger.info('Queue service shut down');
    } catch (error) {
      this.logger.error('Error shutting down queue service:', error);
    }
  }
}

// Singleton instance
let queueServiceInstance: QueueService | null = null;

export function initializeQueueService(logger: Logger): QueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService(logger);
  }
  return queueServiceInstance;
}

export function getQueueService(): QueueService {
  if (!queueServiceInstance) {
    throw new Error('Queue service not initialized. Call initializeQueueService first.');
  }
  return queueServiceInstance;
}