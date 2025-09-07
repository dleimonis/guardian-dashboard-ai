import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import winston from 'winston';
import { disasterRoutes, setOrchestrator as setDisasterOrchestrator } from './routes/disasters';
import { alertRoutes, setDependencies as setAlertDependencies } from './routes/alerts';
import { agentRoutes, setOrchestrator as setAgentOrchestrator } from './routes/agents';
import { WebSocketManager } from './services/websocket';
import { AgentOrchestrator } from './agents/orchestrator';
import { DisasterMonitoringService } from './services/monitoring';

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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'], // Vite dev servers
  credentials: true,
}));
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
app.use('/api/disasters', disasterRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agents', agentRoutes);

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

// Initialize Disaster Monitoring Service
const monitoringService = new DisasterMonitoringService(logger, orchestrator);

// Start the server
server.listen(port, () => {
  logger.info(`Guardian Dashboard Backend running on port ${port}`);
  logger.info(`WebSocket server available at ws://localhost:${port}/ws`);
  
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