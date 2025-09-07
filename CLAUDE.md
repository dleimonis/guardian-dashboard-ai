# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the MCP Hackathon project repository containing the Guardian Dashboard AI - an emergency management system that uses a multi-agent AI architecture to detect, analyze, and respond to disasters in real-time. The main application is located in `theme1-agent/guardian-dashboard-ai/`.

## Project Structure

```
mcp-hackathon/
├── theme1-agent/
│   ├── guardian-dashboard-ai/    # Main application
│   │   ├── src/                  # React frontend
│   │   ├── backend/              # Node.js backend with AI agents
│   │   └── CLAUDE.md             # Detailed application-specific guidance
│   ├── app_prd.md                # Product Requirements Document
│   └── hackathon.pdf             # Hackathon documentation
└── .claude/                       # Claude Code configuration
```

## Essential Commands

All commands should be run from the `theme1-agent/guardian-dashboard-ai/` directory:

### Development
```bash
cd theme1-agent/guardian-dashboard-ai

# Install all dependencies (frontend + backend)
npm install

# Run both frontend and backend in development mode
npm run dev

# Run frontend only (port 8080)
npm run dev:frontend

# Run backend only (port 3001)  
npm run dev:backend
```

### Building and Production
```bash
cd theme1-agent/guardian-dashboard-ai

# Build both frontend and backend
npm run build

# Start production servers
npm start
```

### Code Quality
```bash
cd theme1-agent/guardian-dashboard-ai

# Run ESLint on frontend
npm run lint

# Run ESLint on backend
cd backend && npm run lint

# Run backend tests
cd backend && npm test

# Run a single test
cd backend && npm test -- --testNamePattern="agent name"
```

## High-Level Architecture

### Multi-Agent AI System
The core innovation is an orchestrated multi-agent architecture with three specialized squads:

1. **Detection Squad** (`backend/src/agents/detection/`)
   - FireWatcher: NASA FIRMS satellite fire detection
   - QuakeDetector: USGS earthquake monitoring
   - WeatherTracker: NOAA severe weather tracking
   - FloodMonitor: Water level monitoring

2. **Analysis Squad** (`backend/src/agents/analysis/`)
   - ThreatAnalyzer: Assesses threat levels
   - ImpactPredictor: Predicts disaster impact zones
   - RouteCalculator: Calculates evacuation routes
   - PriorityManager: Prioritizes emergency responses

3. **Action Squad** (`backend/src/agents/action/`)
   - AlertDispatcher: Sends disaster warnings
   - NotificationManager: Multi-channel alerts
   - StatusReporter: System status updates

The orchestrator (`backend/src/agents/orchestrator.ts`) manages inter-agent communication through a message queue system.

### Key System Components

#### Frontend (React + TypeScript)
- **Real-time World Map**: Leaflet-based interactive disaster visualization
- **Agent Status Monitoring**: Live status cards for all AI agents
- **Alert Feed**: Real-time disaster alerts with severity levels
- **Emergency Simulation**: Test scenarios including MEGA DISASTER mode
- **WebSocket Client**: Maintains persistent connection for live updates

#### Backend (Node.js + Express)
- **Agent Orchestrator**: Coordinates all AI agents and message routing
- **WebSocket Server**: Broadcasts real-time updates to connected clients
- **REST API**: Endpoints for disasters, alerts, agents, and simulations
- **Simulation Engine**: Disaster scenario testing without external dependencies
- **Descope Integration**: Authentication and API key management

### Real-Time Communication Flow
1. Detection agents poll external APIs on configurable intervals
2. On disaster detection, agents emit events to orchestrator
3. Orchestrator routes events to Analysis squad for processing
4. Analysis results trigger Action squad for response
5. Actions broadcast via WebSocket to all connected frontend clients
6. Frontend updates map markers, alerts, and statistics in real-time

### Agent Base Class Pattern
All agents extend `BaseAgent` which provides:
- Lifecycle management (initialize, start, stop)
- Status tracking with heartbeat monitoring
- Inter-agent message handling
- Winston logger integration
- Event emission for orchestrator

### Emergency Simulation System
The frontend emergency button triggers disaster simulations:
- Bypasses external APIs using mock data
- Tests full agent pipeline end-to-end
- MEGA DISASTER mode simulates multiple simultaneous disasters
- Simulation endpoints in `backend/src/routes/agents.ts`

## Environment Configuration

### Frontend (.env in guardian-dashboard-ai/)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_DESCOPE_PROJECT_ID=<from_descope_console>
```

### Backend (backend/.env)
```env
PORT=3001
NODE_ENV=development
DESCOPE_PROJECT_ID=<from_descope_console>
DESCOPE_MANAGEMENT_KEY=<from_descope_console>

# Optional API Keys (stored in Descope vault for production)
NASA_API_KEY=DEMO_KEY
USGS_API_URL=https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary
NOAA_API_KEY=DEMO_KEY
```

## Development Patterns

### Adding a New Agent
1. Create agent in appropriate squad folder: `backend/src/agents/{squad}/{agent-name}.ts`
2. Extend `BaseAgent` class
3. Implement required methods: `initialize()`, `process()`, `handleMessage()`
4. Register in `backend/src/agents/orchestrator.ts`

### WebSocket Message Protocol
```typescript
// Frontend to Backend
{
  type: 'subscribe' | 'ping',
  channels?: ['disasters', 'alerts', 'agents', 'statistics']
}

// Backend to Frontend
{
  type: 'disaster' | 'alert' | 'agent_status' | 'statistics',
  data: any,
  timestamp: string
}
```

### Testing WebSocket Connection
```bash
# Using wscat or similar tool
wscat -c ws://localhost:3001/ws
> {"type":"subscribe","channels":["disasters","alerts","agents","statistics"]}
```

## Important Notes

- **Descope Authentication**: All API keys must be stored in Descope vault, never hardcoded
- **Simulation Mode**: System works without external APIs for demos and testing
- **Agent Intervals**: Configured to prevent API rate limiting
- **WebSocket Heartbeat**: Automatic reconnection on connection loss
- **CORS**: Configured for localhost development only

For detailed application-specific guidance, refer to `theme1-agent/guardian-dashboard-ai/CLAUDE.md`.