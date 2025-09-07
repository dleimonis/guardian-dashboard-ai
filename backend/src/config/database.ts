import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/User';
import { Disaster } from '../entities/Disaster';
import { Alert } from '../entities/Alert';
import { AlertZone } from '../entities/AlertZone';
import { AgentLog } from '../entities/AgentLog';
import { NotificationHistory } from '../entities/NotificationHistory';
import { ApiKey } from '../entities/ApiKey';
import { SystemStatistics } from '../entities/SystemStatistics';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'guardian',
  password: process.env.DATABASE_PASSWORD || 'guardian_pass',
  database: process.env.DATABASE_NAME || 'guardian_db',
  synchronize: isDevelopment && !isTest, // Auto-sync in dev only
  logging: isDevelopment && process.env.DEV_VERBOSE_LOGGING === 'true',
  entities: [
    User,
    Disaster,
    Alert,
    AlertZone,
    AgentLog,
    NotificationHistory,
    ApiKey,
    SystemStatistics,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined,
  poolSize: 10,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize database connection
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established');
      
      // Run migrations in production
      if (!isDevelopment && !isTest) {
        await AppDataSource.runMigrations();
        console.log('✅ Database migrations completed');
      }
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}