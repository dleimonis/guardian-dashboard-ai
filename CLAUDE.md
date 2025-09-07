# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guardian Dashboard AI is an emergency management system built for the MCP Hackathon. It uses a multi-agent AI architecture to detect, analyze, and respond to disasters in real-time. The system consists of a React frontend dashboard and a Node.js backend with 12+ specialized AI agents organized into three squads: Detection, Analysis, and Action.

## Essential Commands

### Development
```bash
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
# Build both frontend and backend
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Start production servers
npm start
```

### Code Quality
```bash
# Run ESLint on frontend
npm run lint

# Run ESLint on backend
cd backend && npm run lint

# Run tests (backend only)
cd backend && npm test
```

## Architecture Overview

### Multi-Agent System
The core innovation is the agent orchestrator system that coordinates three squads of specialized AI agents:

1. **Detection Squad** - Monitors external APIs for disasters
   - FireWatcher: NASA FIRMS satellite fire detection
   - QuakeDetector: USGS earthquake monitoring
   - WeatherTracker: NOAA severe weather tracking
   - FloodMonitor: Water level monitoring

2. **Analysis Squad** - Processes detected events
   - ThreatAnalyzer: Assesses threat levels
   - ImpactPredictor: Predicts disaster impact zones
   - RouteCalculator: Calculates evacuation routes
   - PriorityManager: Prioritizes emergency responses

3. **Action Squad** - Takes emergency actions
   - AlertDispatcher: Sends disaster warnings
   - NotificationManager: Multi-channel alerts (SMS/Email/Push)
   - StatusReporter: System status updates

The orchestrator (`backend/src/agents/orchestrator.ts`) manages inter-agent communication through a message queue system, allowing agents to collaborate on disaster response.

### WebSocket Real-Time Communication
The system uses WebSocket connections for live updates between backend and frontend:
- Disaster events broadcast instantly to connected clients
- Agent status updates shown in real-time
- Alert notifications pushed immediately
- Statistics update continuously

### Authentication with Descope
All authentication is handled through Descope per hackathon requirements:
- User authentication via Descope Flow widget
- API keys stored securely in Descope vault (never in code)
- Outbound Apps for external service integration
- No hardcoded tokens or custom auth logic

## Key Technical Patterns

### Agent Base Class Pattern
All agents extend `BaseAgent` which provides:
- Lifecycle management (initialize, start, stop)
- Status tracking and reporting
- Message handling between agents
- Error handling and logging
- Event emission for orchestrator

### Disaster Event Flow
1. Detection agents poll external APIs
2. On detection, emit `disaster_detected` event
3. Orchestrator routes to Analysis squad
4. Analysis agents process and emit `analysis_complete`
5. Orchestrator triggers Action squad
6. Actions broadcast via WebSocket to frontend

### Simulation System
The emergency button triggers disaster simulations:
- Simulations bypass external APIs
- Test the full agent pipeline
- MEGA DISASTER mode tests system under extreme load
- Located in `backend/src/routes/agents.ts`

## External Service Integration

### Required API Keys (via Descope)
- **NASA FIRMS MAP_KEY**: Required for fire detection
- **USGS API**: Public, no key needed
- **NOAA API**: Public, no key needed
- **Twilio**: Optional, for SMS alerts
- **SendGrid**: Optional, for email alerts

### Environment Variables
Frontend (.env):
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_DESCOPE_PROJECT_ID=<from_descope_console>
```

Backend (backend/.env):
```
PORT=3001
NODE_ENV=development
DESCOPE_PROJECT_ID=<from_descope_console>
DESCOPE_MANAGEMENT_KEY=<from_descope_console>
```

## Frontend Component Structure

### Core Components
- `WorldMap.tsx`: Leaflet map with disaster markers
- `AgentStatusCard.tsx`: Real-time agent monitoring
- `AlertCard.tsx`: Disaster alert display
- `EmergencyButton.tsx`: Simulation trigger interface
- `DescopeAuth.tsx`: Authentication wrapper

### UI Library
Uses shadcn/ui components in `src/components/ui/` - pre-built, accessible React components following Radix UI patterns.

## Testing and Development

### Running a Single Test
```bash
cd backend
npm test -- --testNamePattern="agent name"
```

### Debugging Agents
Each agent logs to Winston logger with levels:
- error: Critical failures
- warn: Disasters detected
- info: Status changes
- debug: Message routing

Check `backend/dist/` for compiled TypeScript output.

### WebSocket Testing
Connect to `ws://localhost:3001/ws` and send:
```json
{
  "type": "subscribe",
  "channels": ["disasters", "alerts", "agents", "statistics"]
}
```

## Common Development Tasks

### Adding a New Agent
1. Create in appropriate squad folder: `backend/src/agents/{squad}/{agent-name}.ts`
2. Extend `BaseAgent` class
3. Implement `initialize()`, `process()`, and `handleMessage()`
4. Register in `orchestrator.ts`

### Adding a New Disaster Type
1. Update `DisasterEvent` type in `orchestrator.ts`
2. Create detection agent for new type
3. Add analysis logic to threat analyzer
4. Update frontend map markers

### Modifying Alert Channels
1. Update `NotificationManagerAgent` in `backend/src/agents/action/`
2. Add service credentials via Descope
3. Implement channel-specific logic

## Performance Considerations

- Agents run on intervals to prevent API rate limiting
- WebSocket uses heartbeat to detect stale connections
- Frontend uses React Query for efficient data caching
- Map markers are clustered for performance with many disasters

## Security Notes

- All external API keys managed through Descope
- WebSocket connections require authentication token
- Simulations marked with `isSimulation: true` flag
- CORS configured for localhost development only