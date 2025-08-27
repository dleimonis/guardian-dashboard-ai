// Simple demo server - No external dependencies, only Node.js built-ins
const http = require('http');
const url = require('url');
const crypto = require('crypto');

console.log('Guardian Dashboard AI - Backend Demo Server');
console.log('===========================================');
console.log('Starting in demo mode...');

const port = 3001;
const clients = new Set();

// Mock agent statuses
const mockAgentStatuses = {
  FireWatcher: { status: 'online', lastActivity: new Date().toISOString(), metrics: { activeFires: 0 } },
  QuakeDetector: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  WeatherTracker: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  FloodMonitor: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  ThreatAnalyzer: { status: 'online', lastActivity: new Date().toISOString(), metrics: { activeThreats: 0 } },
  ImpactPredictor: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  RouteCalculator: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  PriorityManager: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  AlertDispatcher: { status: 'online', lastActivity: new Date().toISOString(), metrics: { activeAlerts: 1 } },
  NotificationManager: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
  StatusReporter: { status: 'online', lastActivity: new Date().toISOString(), metrics: {} },
};

// Simple CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mode: 'demo',
    });
  }
  else if (pathname === '/api/agents/status' && method === 'GET') {
    sendJson(res, 200, mockAgentStatuses);
  }
  else if (pathname.startsWith('/api/agents/') && pathname.endsWith('/status') && method === 'GET') {
    const agentName = pathname.split('/')[3];
    const status = mockAgentStatuses[agentName];
    if (status) {
      sendJson(res, 200, status);
    } else {
      sendJson(res, 404, { error: 'Agent not found' });
    }
  }
  else if (pathname === '/api/disasters' && method === 'GET') {
    sendJson(res, 200, [
      {
        id: 'demo_fire_1',
        type: 'fire',
        severity: 'high',
        location: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
        timestamp: new Date().toISOString(),
      }
    ]);
  }
  else if (pathname === '/api/alerts' && method === 'GET') {
    sendJson(res, 200, [
      {
        id: 'alert_demo_1',
        title: 'System Active',
        description: 'Emergency monitoring system is operational',
        severity: 'info',
        location: 'System Wide',
        timestamp: new Date().toISOString(),
        status: 'active',
      }
    ]);
  }
  else if (pathname === '/api/alerts/statistics' && method === 'GET') {
    sendJson(res, 200, {
      total: 10,
      active: 1,
      critical: 0,
      acknowledged: 5,
      dismissed: 4,
    });
  }
  else if (pathname === '/api/agents/simulate/scenarios' && method === 'GET') {
    sendJson(res, 200, [
      {
        id: 'earthquake_major',
        name: 'Major Earthquake',
        description: 'Magnitude 7.2 earthquake in San Francisco',
        type: 'earthquake',
        severity: 'critical',
        location: { lat: 37.7749, lon: -122.4194, name: 'San Francisco, CA' },
        data: { magnitude: 7.2 },
      },
      {
        id: 'wildfire_spreading',
        name: 'Spreading Wildfire',
        description: 'Large wildfire with high spread rate',
        type: 'fire',
        severity: 'critical',
        location: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
        data: { firePower: 75 },
      },
      {
        id: 'mega_disaster',
        name: 'MEGA DISASTER',
        description: 'Multiple simultaneous disasters for maximum chaos!',
        type: 'multi',
        severity: 'critical',
        location: { lat: 36.7783, lon: -119.4179, name: 'California' },
        data: { disasters: ['earthquake', 'fire', 'flood'] },
      },
    ]);
  }
  else if (pathname === '/api/agents/simulate' && method === 'POST') {
    try {
      const scenario = await parseJsonBody(req);
      console.log('Simulation requested:', scenario);
      
      sendJson(res, 200, {
        simulationId: `sim_${Date.now()}`,
        status: 'running',
        message: 'Simulation started successfully',
      });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body' });
    }
  }
  else {
    sendJson(res, 404, { error: 'Not found' });
  }
});

// WebSocket handling with proper protocol implementation
server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  
  if (pathname === '/ws') {
    console.log('WebSocket connection attempt');
    
    // Get the WebSocket key from headers
    const key = request.headers['sec-websocket-key'];
    if (!key) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
    
    // Generate accept key per WebSocket protocol
    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');
    
    // Send proper WebSocket handshake response
    socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                'Upgrade: websocket\r\n' +
                'Connection: Upgrade\r\n' +
                `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
                '\r\n');
    
    clients.add(socket);
    console.log('WebSocket client connected. Total clients:', clients.size);
    
    // Send initial connection message
    const connectionMessage = JSON.stringify({
      type: 'connection',
      data: { status: 'connected', timestamp: new Date().toISOString() }
    });
    sendWebSocketFrame(socket, connectionMessage);
    
    // Handle incoming WebSocket frames
    socket.on('data', (buffer) => {
      try {
        const message = parseWebSocketFrame(buffer);
        if (message) {
          console.log('Received WebSocket message:', message);
          
          // Handle ping/pong
          if (message === '{"type":"ping"}') {
            const pongMessage = JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            });
            sendWebSocketFrame(socket, pongMessage);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket frame:', error);
      }
    });
    
    socket.on('close', () => {
      clients.delete(socket);
      console.log('WebSocket client disconnected. Total clients:', clients.size);
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(socket);
    });
    
    // Send periodic updates to keep connection alive
    const updateInterval = setInterval(() => {
      if (socket.destroyed) {
        clearInterval(updateInterval);
        return;
      }
      
      // Send agent status update
      const statusUpdate = JSON.stringify({
        type: 'agent_status',
        data: {
          agent: 'FireWatcher',
          status: 'online',
          lastActivity: new Date().toISOString(),
          metrics: { activeFires: Math.floor(Math.random() * 3) }
        },
        timestamp: new Date().toISOString()
      });
      
      try {
        sendWebSocketFrame(socket, statusUpdate);
      } catch (error) {
        clearInterval(updateInterval);
      }
    }, 5000);
  }
});

// Helper function to send WebSocket frames
function sendWebSocketFrame(socket, message) {
  const messageBuffer = Buffer.from(message);
  const length = messageBuffer.length;
  
  let frame;
  if (length < 126) {
    frame = Buffer.allocUnsafe(2 + length);
    frame[0] = 0x81; // FIN + text frame
    frame[1] = length;
    messageBuffer.copy(frame, 2);
  } else if (length < 65536) {
    frame = Buffer.allocUnsafe(4 + length);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
    messageBuffer.copy(frame, 4);
  } else {
    frame = Buffer.allocUnsafe(10 + length);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(length), 2);
    messageBuffer.copy(frame, 10);
  }
  
  socket.write(frame);
}

// Helper function to parse WebSocket frames
function parseWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;
  
  const firstByte = buffer[0];
  const secondByte = buffer[1];
  
  const fin = !!(firstByte & 0x80);
  const opcode = firstByte & 0x0f;
  const masked = !!(secondByte & 0x80);
  let payloadLength = secondByte & 0x7f;
  
  let offset = 2;
  
  if (payloadLength === 126) {
    if (buffer.length < offset + 2) return null;
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    if (buffer.length < offset + 8) return null;
    payloadLength = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }
  
  let maskKey;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    maskKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  
  if (buffer.length < offset + payloadLength) return null;
  
  let payload = buffer.slice(offset, offset + payloadLength);
  
  if (masked) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskKey[i % 4];
    }
  }
  
  // Handle different opcodes
  if (opcode === 0x8) {
    // Connection close frame
    return null;
  }
  
  if (opcode === 0x1) {
    // Text frame
    return payload.toString('utf8');
  }
  
  return null;
}

// Start server
server.listen(port, () => {
  console.log(`\n✅ Backend server running on port ${port}`);
  console.log(`📡 WebSocket available at ws://localhost:${port}/ws`);
  console.log(`🌐 API available at http://localhost:${port}/api`);
  console.log(`\n💡 This is a demo server with simulated agent responses.`);
  console.log(`   The full multi-agent system requires proper TypeScript compilation.`);
  console.log(`\nOpen http://localhost:8081 in your browser to see the dashboard!`);
});