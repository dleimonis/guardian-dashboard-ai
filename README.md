# 🚨 Guardian Dashboard - Emergency Management System

[![Built with React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Powered by Technology](https://img.shields.io/badge/Powered%20by-Technology-orange.svg)](https://github.com/dleimonis/guardian-dashboard)
[![MCP Hackathon](https://img.shields.io/badge/MCP-Hackathon-purple.svg)](https://github.com/dleimonis/guardian-dashboard-ai)

> **Building an Emergency Hero System** - A multi-agent system that monitors disasters 24/7 and automatically warns people to save lives. Like having a superhero that never sleeps!

## 🌟 Overview

Guardian Dashboard is an advanced emergency management system that uses multiple automated agents to detect, analyze, and respond to disasters in real-time. Built for the MCP Hackathon, it demonstrates how automation can be used to save lives by providing early warnings and coordinated emergency responses.

### 🎯 Key Features

- **🤖 Multi-Agent System** - 12+ specialized agents working together
- **🌍 Real-Time World Map** - Interactive Leaflet map with live disaster tracking
- **📡 WebSocket Updates** - Live data streaming for instant alerts
- **🚨 Emergency Simulation** - Test scenarios including MEGA DISASTER mode
- **🔐 Secure Authentication** - Descope integration for user management
- **📊 Live Statistics** - Real-time metrics and agent monitoring
- **🎮 Simulation Control** - Interactive disaster scenario testing

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────┐
│          Guardian Dashboard Frontend         │
│         (React + TypeScript + Leaflet)       │
└────────────────┬────────────────────────────┘
                 │ WebSocket + REST API
┌────────────────┴────────────────────────────┐
│           Backend Server (Node.js)           │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │      Agent Orchestrator System      │    │
│  │                                     │    │
│  │  ┌──────────┐  ┌──────────┐       │    │
│  │  │Detection │  │Analysis  │       │    │
│  │  │  Squad   │→ │  Squad   │→      │    │
│  │  └──────────┘  └──────────┘       │    │
│  │                     ↓              │    │
│  │              ┌──────────┐          │    │
│  │              │ Action   │          │    │
│  │              │  Squad   │          │    │
│  │              └──────────┘          │    │
│  └─────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
                 │ External APIs
┌────────────────┴────────────────────────────┐
│  NASA FIRMS │ USGS │ NOAA │ GDACS           │
└──────────────────────────────────────────────┘
```

### Agent Squads

#### 🔍 Detection Squad (Monitoring 24/7)
- **FireWatcher** - NASA satellite fire detection
- **QuakeDetector** - USGS earthquake monitoring
- **WeatherTracker** - NOAA severe weather tracking
- **FloodMonitor** - Water level monitoring

#### 🧠 Analysis Squad (Making Decisions)
- **ThreatAnalyzer** - Assess threat levels
- **ImpactPredictor** - Predict disaster impact
- **RouteCalculator** - Best evacuation paths
- **PriorityManager** - Prioritize responses

#### 🚀 Action Squad (Taking Action)
- **AlertDispatcher** - Send warnings
- **NotificationManager** - Multi-channel alerts (SMS/Email/Push)
- **StatusReporter** - System status updates

## 🚀 Quick Start for Judges

### 🎯 Test the MEGA DISASTER Mode
```bash
# Clone and install
git clone https://github.com/dleimonis/guardian-dashboard-ai.git
cd guardian-dashboard-ai
npm install

# Start the application
npm run dev

# Open http://localhost:8080
# Click red EMERGENCY button → Select MEGA DISASTER → Watch the magic!
```

### 📖 Demo Script Available
See [DEMO_SCRIPT.md](https://github.com/dleimonis/guardian-dashboard-ai/blob/main/DEMO_SCRIPT.md) for a complete walkthrough.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dleimonis/guardian-dashboard-ai.git
cd guardian-dashboard-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` in the root directory:
```env
# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
VITE_DESCOPE_PROJECT_ID=your_project_id
```

Create `backend/.env`:
```env
# Backend
PORT=3001
NODE_ENV=development

# API Keys (Optional - will use simulation mode)
NASA_API_KEY=DEMO_KEY
USGS_API_URL=https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary
NOAA_API_KEY=DEMO_KEY

# Descope (Optional)
DESCOPE_PROJECT_ID=your_project_id
DESCOPE_MANAGEMENT_KEY=your_key
```

4. **Start the application**
```bash
# Development mode - starts both frontend and backend
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

5. **Access the dashboard**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🎮 Using the Emergency Button

The Emergency Button is the centerpiece of the simulation system:

1. Click the **EMERGENCY** button in the bottom-right
2. Select a disaster scenario:
   - 💥 **MEGA DISASTER** - Multiple simultaneous disasters
   - 🌍 **Major Earthquake** - Magnitude 7.5 earthquake
   - 🔥 **Spreading Wildfire** - Rapidly spreading fire
   - 🌀 **Category 5 Hurricane** - Major hurricane
   - 🌊 **Tsunami Warning** - Coastal tsunami threat
3. Click **Run Simulation** to trigger the scenario
4. Watch the dashboard update in real-time!

## 📡 API Documentation

### REST Endpoints

#### Disasters
- `GET /api/disasters` - Get all active disasters
- `GET /api/disasters/:id` - Get disaster by ID
- `GET /api/disasters/location/:lat/:lon` - Get disasters by location
- `POST /api/disasters` - Report new disaster (auth required)

#### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/preferences` - Get user alert preferences
- `PUT /api/alerts/preferences` - Update preferences
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/dismiss` - Dismiss alert

#### Agents
- `GET /api/agents/status` - Get all agent statuses
- `GET /api/agents/:name/status` - Get specific agent status
- `POST /api/agents/simulate` - Run simulation
- `GET /api/agents/simulate/scenarios` - Get available scenarios

### WebSocket Events

Connect to `ws://localhost:3001/ws` for real-time updates:

#### Incoming Messages
```javascript
{
  type: 'disaster' | 'alert' | 'agent_status' | 'statistics',
  data: any,
  timestamp: string
}
```

#### Outgoing Messages
```javascript
// Subscribe to channels
{
  type: 'subscribe',
  channels: ['disasters', 'alerts', 'agents', 'statistics']
}

// Heartbeat
{
  type: 'ping'
}
```

## 🤖 MCP (Model Context Protocol) Integration

Guardian Dashboard includes a full MCP server implementation for external agent connectivity:

### MCP Server Features
- **Tools**: Disaster detection, threat analysis, alert dispatch, simulation
- **Resources**: Active disasters, recent alerts, agent status, system statistics
- **Prompts**: Emergency response planning, evacuation coordination
- **Security**: Role-based permissions, rate limiting, token authentication

### MCP Tools Available
```javascript
// Detect disasters in a specific area
detect_disaster({ location: { lat, lon }, radius, disasterTypes })

// Analyze threat levels
analyze_threat({ disasterId, includeEvacuation, priorityThreshold })

// Dispatch emergency alerts
dispatch_alert({ alertType, channels, message, affectedZones })

// Run disaster simulation
simulate_disaster({ scenario, intensity })

// Get agent status
get_agent_status({ squad })
```

### Connecting to MCP Server
```bash
# Start MCP server (port 3002)
cd backend && node dist/mcp-server.js

# Test with curl
curl -X POST http://localhost:3002/mcp/detect_disaster \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location": {"lat": 37.7749, "lon": -122.4194}, "radius": 100}'
```

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Leaflet** - Interactive maps
- **shadcn/ui** - Component library
- **React Query** - Data fetching
- **WebSocket** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **WebSocket (ws)** - Real-time communication
- **Descope** - Authentication
- **Winston** - Logging
- **node-cron** - Scheduled tasks

### External APIs
- **NASA FIRMS** - Fire detection
- **USGS** - Earthquake data
- **NOAA** - Weather information
- **OpenStreetMap** - Map tiles

## 📁 Project Structure

```
guardian-dashboard-ai/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── pages/             # Page components
├── backend/               # Backend source
│   ├── src/
│   │   ├── agents/        # AI agents
│   │   │   ├── detection/ # Detection squad
│   │   │   ├── analysis/  # Analysis squad
│   │   │   └── action/    # Action squad
│   │   ├── routes/        # API routes
│   │   ├── services/      # Services
│   │   └── index.ts       # Server entry
│   └── package.json
└── package.json           # Root package
```

## 🎯 Development

### Adding a New Agent

1. Create agent file in appropriate squad folder:
```typescript
// backend/src/agents/detection/new-agent.ts
import { BaseAgent } from '../base-agent';

export class NewAgent extends BaseAgent {
  protected async initialize(): Promise<void> {
    // Setup code
  }
  
  protected async process(): Promise<void> {
    // Main processing logic
  }
  
  protected handleMessage(message: AgentMessage): void {
    // Handle inter-agent messages
  }
}
```

2. Register in orchestrator:
```typescript
// backend/src/agents/orchestrator.ts
this.registerAgent(new NewAgent(this.logger, this));
```

### Environment Modes

- **Development**: Full logging, mock data available
- **Production**: Optimized, requires real API keys
- **Demo**: Simulation mode without external APIs

## 🚀 Deployment

### Deploy to Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📸 Screenshots

### Main Dashboard
- Real-time world map with disaster markers
- Agent status monitoring
- Alert feed with severity indicators
- Live statistics bar

### Emergency Simulation
- Scenario selection dropdown
- MEGA DISASTER mode
- Real-time simulation feedback

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Credits

### MCP Hackathon - Teen Edition
Built for the Model Context Protocol Hackathon, demonstrating how AI agents can work together to save lives.

### Technologies
- Powered by [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Real-time WebSocket communication
- Maps by [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)

### Team
- Lead Developer: Dimitris Leimonis
- System Architecture: Multi-Agent Design
- Design: JARVIS-inspired crisis command center

## 🌟 Vision

> "Imagine creating a system that watches for disasters 24/7 and automatically warns people to get to safety. It's like having a superhero that never sleeps, constantly checking for earthquakes, fires, floods, and storms, then sending alerts to save lives!"

This project demonstrates the power of automation in emergency management, showing how multiple specialized agents can work together to detect threats, analyze impacts, and coordinate responses - all in real-time.

---

**🚨 Remember: With great power comes great responsibility to save lives! 🚨**

Built with ❤️ for the MCP Hackathon