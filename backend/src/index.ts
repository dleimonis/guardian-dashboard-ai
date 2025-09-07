import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import winston from 'winston';
import { disasterRoutes, setOrchestrator as setDisasterOrchestrator } from './routes/disasters';
import { alertRoutes, setDependencies as setAlertDependencies } from './routes/alerts';
import { agentRoutes, setOrchestrator as setAgentOrchestrator } from './routes/agents';
import { createAuthRoutes } from './routes/auth';
import communityRoutes from './routes/community';
import { analyticsRoutes, setOrchestrator as setAnalyticsOrchestrator, recordDisasterEvent } from './routes/analytics';
import { userRoutes } from './routes/users';
import { WebSocketManager } from './services/websocket';
import { AgentOrchestrator } from './agents/orchestrator';
import { DisasterMonitoringService } from './services/monitoring';
import { DescopeAuthService } from './services/descope-auth';
import { logDemoStatus } from './config/demo-mode';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const app = express();
const port = process.env.PORT || 3001;

// Initialize Descope Auth Service
const authService = new DescopeAuthService({
  projectId: process.env.DESCOPE_PROJECT_ID!,
  managementKey: process.env.DESCOPE_MANAGEMENT_KEY
}, logger);

// Configure CORS for development and production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      process.env.FRONTEND_URL,
      // Add Lovable domains
      /https:\/\/.*\.lovable\.app$/,
      /https:\/\/.*\.lovableproject\.com$/,
      // Allow all localhost ports for development (8080-8090)
      /http:\/\/localhost:80[8-9][0-9]/,
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', createAuthRoutes(authService, logger));
app.use('/api/disasters', disasterRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
});

// Initialize WebSocket manager
const wsManager = new WebSocketManager(wss, logger);

// Initialize Agent Orchestrator
const orchestrator = new AgentOrchestrator(logger, wsManager);

// Set orchestrator in routes
setDisasterOrchestrator(orchestrator);
setAlertDependencies(orchestrator, wsManager);
setAgentOrchestrator(orchestrator);
setAnalyticsOrchestrator(orchestrator);

// Initialize Disaster Monitoring Service
const monitoringService = new DisasterMonitoringService(logger, orchestrator);

// Start the server
server.listen(port, () => {
  logger.info(`Guardian Dashboard Backend running on port ${port}`);
  logger.info(`WebSocket server available at ws://localhost:${port}/ws`);
  
  // Log demo mode status for hackathon
  logDemoStatus(logger);
  
  // Start monitoring services
  monitoringService.start();
  orchestrator.initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  monitoringService.stop();
  orchestrator.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, logger, wsManager, orchestrator };