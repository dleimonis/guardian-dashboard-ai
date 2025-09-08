# Guardian AI - MCP Hackathon Submission

## 🚨 Multi-Agent Emergency Response System

**Team:** Solo Developer
**Hackathon:** MCP Teen Edition
**Theme:** AI Emergency Hero System
**Repository:** https://github.com/dleimonis/guardian-dashboard-ai

---

## 📋 Quick Links

- [Live Demo](#live-demo)
- [Video Demo](#video-demo)
- [Presentation](#presentation)
- [Setup Instructions](#setup-instructions)
- [Architecture](#architecture)

---

## 🎯 Problem Statement

Every year, thousands of lives are lost to natural disasters that could have been prevented with early warning systems. Current emergency response systems suffer from:

- **Delayed Detection:** Hours pass between disaster occurrence and detection
- **Fragmented Systems:** No unified platform for multiple disaster types
- **Manual Monitoring:** Requires human operators 24/7
- **Slow Response:** By the time authorities act, it's often too late

## 💡 Our Solution

Guardian AI is an autonomous multi-agent system that:
- Monitors disasters worldwide 24/7 without human intervention
- Detects threats in seconds, not hours
- Coordinates response through 12 specialized AI agents
- Dispatches warnings automatically to save lives

Think of it as having a superhero AI that never sleeps!

---

## 🏗️ Architecture Overview

### Multi-Agent System (12 Agents, 3 Squads)

```
DETECTION SQUAD → ANALYSIS SQUAD → ACTION SQUAD
     ↓                ↓                ↓
FireWatcher     ThreatAnalyzer   AlertDispatcher
QuakeDetector   ImpactPredictor  NotificationManager
WeatherTracker  RouteCalculator  StatusReporter
FloodMonitor    PriorityManager  Orchestrator
```

### Key Innovation
- **Orchestrated Intelligence:** Central coordinator managing all agents
- **Event-Driven Architecture:** Real-time cascade processing
- **WebSocket Broadcasting:** Instant updates to all clients
- **Message Queue System:** Asynchronous inter-agent communication

---

## 🎮 Demo Instructions

### Quick Start (No Setup Required!)

1. **Visit the Live Demo**
   - Go to: [Your deployed URL or localhost:8080]
   - Click "Skip to Demo Mode" for instant access

2. **Try the Emergency Button**
   - Click the red EMERGENCY button (bottom-right)
   - Select "MEGA DISASTER" for maximum impact
   - Click "Run Simulation"
   - Watch 12 agents spring into action!

3. **Explore Live Features**
   - **World Map:** See real earthquakes from USGS (45+ detected today!)
   - **Agent Status:** Watch agents work in real-time
   - **Alert Feed:** Monitor incoming disaster alerts
   - **Statistics Bar:** Track system performance

### For Judges - Full Setup

```bash
# 1. Clone and install
git clone https://github.com/dleimonis/guardian-dashboard-ai.git
cd guardian-dashboard-ai
npm install

# 2. Run in demo mode (no API keys needed!)
npm run dev

# 3. Open browser
http://localhost:8080

# 4. Click "Skip to Demo Mode" to bypass authentication
```

---

## 🛠️ Technology Stack

### Frontend
- React 18.3
- TypeScript 5.8
- Vite
- TailwindCSS
- Leaflet Maps
- shadcn/ui
- WebSockets

### Backend
- Node.js
- Express.js
- TypeScript
- WebSocket (ws)
- Winston Logger
- node-cron

### Security & Auth
- Descope Integration
- Zero hardcoded credentials
- Environment validation (Zod)
- Rate limiting
- Helmet.js

### External APIs
- NASA FIRMS
- USGS Earthquake
- NOAA Weather
- OpenStreetMap

---

## ✅ MCP Hackathon Requirements

### Descope Integration ✅
- Complete authentication flow
- API key vault for secure storage
- No hardcoded tokens anywhere
- Demo mode for easy testing

### Security ✅
- All credentials in environment variables
- Input validation and sanitization
- CORS properly configured
- Rate limiting implemented

### Documentation ✅
- Comprehensive README
- API documentation
- Code comments
- MIT License

---

## 🌟 Key Features

### Real-Time Monitoring
- Live earthquake data from USGS
- Fire detection via NASA satellites
- Weather tracking from NOAA
- Flood monitoring systems

### Intelligent Analysis
- Threat level assessment
- Impact zone prediction
- Evacuation route calculation
- Response prioritization

### Automated Response
- Instant alert dispatching
- Multi-channel notifications
- Status broadcasting
- Emergency coordination

### Testing & Simulation
- One-click disaster simulations
- MEGA DISASTER mode
- No external dependencies
- Full agent pipeline testing

---

## 📊 Impact Metrics

- **Response Time:** Hours → Seconds
- **Coverage:** Global 24/7
- **Accuracy:** Real-time data feeds
- **Scalability:** Unlimited agent expansion
- **Lives Saved:** Potentially thousands annually

---

## 🎥 Demo Resources

### Video Demo
- **Script:** `video-demo-script.md`
- **Duration:** 3 minutes
- **Key Scenes:** 
  - Live system overview
  - Emergency simulation
  - MEGA DISASTER mode
  - Real-time agent coordination

### Presentation
- **File:** `hackathon-presentation.html`
- **Slides:** 10 interactive slides
- **Navigation:** Arrow keys or buttons
- **Topics:** Problem, solution, architecture, demo, impact

---

## 🚀 Future Enhancements

While the core system is complete, future versions could include:
- PostgreSQL database for persistence
- SMS/Email notifications via Twilio/SendGrid
- Machine learning for prediction
- Mobile app development
- Global deployment on AWS/GCP

---

## 📝 Notes for Judges

1. **Demo Mode Available:** No setup required - just click "Skip to Demo Mode"
2. **Real Data:** The earthquakes on the map are REAL from USGS
3. **Simulation Ready:** Emergency button works without any API keys
4. **Production Ready:** Full security, no hardcoded credentials
5. **Scalable:** Architecture supports unlimited agent expansion

---

## 🏆 Why Guardian AI?

- **First-of-its-kind** multi-agent disaster response system
- **Saves lives** through instant automated warnings
- **Works today** with real disaster data
- **Teen-built** for the MCP Hackathon
- **Open source** for global impact

---

## 📞 Contact

- **GitHub:** https://github.com/dleimonis/guardian-dashboard-ai
- **Documentation:** See README.md
- **License:** MIT

---

**Built with ❤️ for the MCP Hackathon - Your Emergency Hero System!**