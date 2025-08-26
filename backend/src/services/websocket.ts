import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface WSMessage {
  type: 'disaster' | 'alert' | 'agent_status' | 'statistics' | 'heartbeat';
  data: any;
  timestamp: string;
}

export class WebSocketManager extends EventEmitter {
  private clients: Map<string, WebSocket> = new Map();
  private logger: Logger;

  constructor(private wss: WebSocketServer, logger: Logger) {
    super();
    this.logger = logger;
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      this.logger.info(`WebSocket client connected: ${clientId}`);
      
      // Send initial connection message
      this.sendToClient(clientId, {
        type: 'heartbeat',
        data: { 
          connected: true, 
          clientId,
          serverTime: new Date().toISOString() 
        },
        timestamp: new Date().toISOString(),
      });

      // Setup heartbeat
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('pong', () => {
        this.logger.debug(`Heartbeat received from ${clientId}`);
      });

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error) {
          this.logger.error(`Failed to parse message from ${clientId}:`, error);
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeatInterval);
        this.clients.delete(clientId);
        this.logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any) {
    this.logger.debug(`Message from ${clientId}:`, message);
    
    // Handle different message types
    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message.channels);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.channels);
        break;
      case 'ping':
        this.sendToClient(clientId, {
          type: 'heartbeat',
          data: { pong: true },
          timestamp: new Date().toISOString(),
        });
        break;
      default:
        this.emit('client_message', { clientId, message });
    }
  }

  private handleSubscription(clientId: string, channels: string[]) {
    // Store subscription preferences (could be extended with Redis or database)
    this.logger.info(`Client ${clientId} subscribed to channels:`, channels);
  }

  private handleUnsubscription(clientId: string, channels: string[]) {
    this.logger.info(`Client ${clientId} unsubscribed from channels:`, channels);
  }

  public sendToClient(clientId: string, message: WSMessage) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        this.logger.debug(`Broadcast sent to ${clientId}`);
      }
    });
  }

  public broadcastDisasterUpdate(disaster: any) {
    this.broadcast({
      type: 'disaster',
      data: disaster,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAlert(alert: any) {
    this.broadcast({
      type: 'alert',
      data: alert,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastAgentStatus(agentStatus: any) {
    this.broadcast({
      type: 'agent_status',
      data: agentStatus,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastStatistics(statistics: any) {
    this.broadcast({
      type: 'statistics',
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }
}