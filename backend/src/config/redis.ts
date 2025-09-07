import Redis from 'ioredis';
import { Logger } from 'winston';

export class RedisService {
  private client: Redis;
  private queueClient: Redis;
  private logger: Logger;
  private isConnected: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;

    // Main Redis client for caching
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    // Separate client for queue operations
    this.queueClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.info('✅ Redis cache connected');
      this.isConnected = true;
    });

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis cache error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.logger.warn('Redis cache connection closed');
      this.isConnected = false;
    });

    this.queueClient.on('connect', () => {
      this.logger.info('✅ Redis queue connected');
    });

    this.queueClient.on('error', (err: Error) => {
      this.logger.error('Redis queue error:', err);
    });
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis getJSON error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      await this.set(key, JSON.stringify(value), ttlSeconds);
    } catch (error) {
      this.logger.error(`Redis setJSON error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DELETE error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Redis HGET error for key ${key}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Redis HSET error for key ${key}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.client.lpush(key, ...values);
    } catch (error) {
      this.logger.error(`Redis LPUSH error for key ${key}:`, error);
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      this.logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}:`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis SISMEMBER error for key ${key}:`, error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      this.logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
    }
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  // Cache key helpers
  getCacheKey(prefix: string, ...parts: string[]): string {
    return `guardian:${prefix}:${parts.join(':')}`;
  }

  // Cache TTL constants (in seconds)
  readonly TTL = {
    DISASTERS: parseInt(process.env.CACHE_TTL_DISASTERS || '900'), // 15 minutes
    AGENTS: parseInt(process.env.CACHE_TTL_AGENTS || '60'), // 1 minute
    API_RESPONSES: parseInt(process.env.CACHE_TTL_API_RESPONSES || '300'), // 5 minutes
    USER_SESSION: 86400, // 24 hours
    TEMP_DATA: 300, // 5 minutes
  };

  // Utility methods
  async flushCache(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.info('Redis cache flushed');
    } catch (error) {
      this.logger.error('Redis flush error:', error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping error:', error);
      return false;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  getQueueClient(): Redis {
    return this.queueClient;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      await this.queueClient.quit();
      this.logger.info('Redis connections closed');
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
    }
  }
}

// Singleton instance
let redisInstance: RedisService | null = null;

export function initializeRedis(logger: Logger): RedisService {
  if (!redisInstance) {
    redisInstance = new RedisService(logger);
  }
  return redisInstance;
}

export function getRedisInstance(): RedisService {
  if (!redisInstance) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return redisInstance;
}