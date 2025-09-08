import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define the environment schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test', 'demo']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3001'),
  
  // Frontend URL - Required in production
  FRONTEND_URL: z.string().url().optional().refine(
    (val) => process.env.NODE_ENV !== 'production' || val,
    'FRONTEND_URL is required in production'
  ),
  
  // Allowed Origins for CORS
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:8080,http://localhost:8081'),
  
  // Descope Configuration
  DESCOPE_PROJECT_ID: z.string().optional(),
  DESCOPE_MANAGEMENT_KEY: z.string().optional(),
  
  // API Keys - Optional but warned if missing
  NASA_API_KEY: z.string().optional(),
  NOAA_API_KEY: z.string().optional(),
  USGS_API_URL: z.string().url().default('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'),
  GDACS_API_URL: z.string().url().default('https://www.gdacs.org/gdacsapi/api/events/geteventlist'),
  
  // Twilio Configuration (Optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Email Configuration (Optional)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().regex(/^\d+$/).optional(),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  
  // Database Configuration (Optional)
  DATABASE_URL: z.string().optional(),
  
  // Redis Configuration (Optional)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().regex(/^\d+$/).default('0'),
  REDIS_QUEUE_DB: z.string().regex(/^\d+$/).default('1'),
  
  // Alert Thresholds
  EARTHQUAKE_MIN_MAGNITUDE: z.string().regex(/^\d+(\.\d+)?$/).default('2.5'),
  FIRE_MIN_CONFIDENCE: z.string().regex(/^\d+$/).default('80'),
  WEATHER_SEVERITY_THRESHOLD: z.string().regex(/^\d+$/).default('3'),
  
  // Security Configuration
  JWT_SECRET: z.string().min(32).optional().refine(
    (val) => process.env.NODE_ENV !== 'production' || val,
    'JWT_SECRET is required in production and must be at least 32 characters'
  ),
  SESSION_SECRET: z.string().min(32).optional().refine(
    (val) => process.env.NODE_ENV !== 'production' || val,
    'SESSION_SECRET is required in production and must be at least 32 characters'
  ),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default('100'),
  
  // Cache TTL
  CACHE_TTL_DISASTERS: z.string().regex(/^\d+$/).default('900'),
  CACHE_TTL_AGENTS: z.string().regex(/^\d+$/).default('60'),
  CACHE_TTL_API_RESPONSES: z.string().regex(/^\d+$/).default('300'),
  
  // Feature Flags
  USE_REAL_EARTHQUAKE_DATA: z.string().transform(val => val === 'true').default('true'),
  ENABLE_DEMO_MODE: z.string().transform(val => val === 'true').default('false'),
});

// Type for the validated environment
export type Environment = z.infer<typeof envSchema>;

// Validate and export the environment
let env: Environment;

try {
  env = envSchema.parse(process.env);
  
  // Log warnings for missing optional configurations
  if (!env.DESCOPE_PROJECT_ID || !env.DESCOPE_MANAGEMENT_KEY) {
    console.warn('⚠️  Descope configuration missing - authentication will be limited');
  }
  
  if (!env.NASA_API_KEY) {
    console.warn('⚠️  NASA API key missing - using demo data for fire detection');
  }
  
  if (!env.NOAA_API_KEY) {
    console.warn('⚠️  NOAA API key missing - weather data will be limited');
  }
  
  if (env.NODE_ENV === 'production') {
    if (!env.JWT_SECRET || !env.SESSION_SECRET) {
      throw new Error('JWT_SECRET and SESSION_SECRET are required in production');
    }
    if (!env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is required in production');
    }
  }
  
  // Security warning for development
  if (env.NODE_ENV === 'development') {
    console.warn('⚠️  Running in development mode - some security features may be relaxed');
  }
  
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach(err => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Export validated environment
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  isDemoMode: env.ENABLE_DEMO_MODE || (!env.DESCOPE_MANAGEMENT_KEY && env.NODE_ENV !== 'production'),
  
  // URLs
  frontendUrl: env.FRONTEND_URL,
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
  
  // Authentication
  descope: {
    projectId: env.DESCOPE_PROJECT_ID || '',
    managementKey: env.DESCOPE_MANAGEMENT_KEY || '',
    isConfigured: !!(env.DESCOPE_PROJECT_ID && env.DESCOPE_MANAGEMENT_KEY),
  },
  
  // Security
  jwtSecret: env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  sessionSecret: env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  
  // APIs
  apis: {
    nasa: {
      key: env.NASA_API_KEY || 'DEMO_KEY',
      hasKey: !!env.NASA_API_KEY,
    },
    noaa: {
      key: env.NOAA_API_KEY || 'DEMO_KEY',
      hasKey: !!env.NOAA_API_KEY,
    },
    usgs: {
      url: env.USGS_API_URL,
    },
    gdacs: {
      url: env.GDACS_API_URL,
    },
  },
  
  // Twilio
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID || '',
    authToken: env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: env.TWILIO_PHONE_NUMBER || '',
    isConfigured: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER),
  },
  
  // Email
  email: {
    host: env.EMAIL_HOST || '',
    port: parseInt(env.EMAIL_PORT || '587'),
    user: env.EMAIL_USER || '',
    password: env.EMAIL_PASSWORD || '',
    isConfigured: !!(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD),
  },
  
  // Database
  database: {
    url: env.DATABASE_URL || '',
    isConfigured: !!env.DATABASE_URL,
  },
  
  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
    db: parseInt(env.REDIS_DB),
    queueDb: parseInt(env.REDIS_QUEUE_DB),
  },
  
  // Alert Thresholds
  thresholds: {
    earthquakeMinMagnitude: parseFloat(env.EARTHQUAKE_MIN_MAGNITUDE),
    fireMinConfidence: parseInt(env.FIRE_MIN_CONFIDENCE),
    weatherSeverityThreshold: parseInt(env.WEATHER_SEVERITY_THRESHOLD),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  },
  
  // Cache TTL
  cacheTTL: {
    disasters: parseInt(env.CACHE_TTL_DISASTERS),
    agents: parseInt(env.CACHE_TTL_AGENTS),
    apiResponses: parseInt(env.CACHE_TTL_API_RESPONSES),
  },
  
  // Feature Flags
  features: {
    useRealEarthquakeData: env.USE_REAL_EARTHQUAKE_DATA,
  },
};

export default config;