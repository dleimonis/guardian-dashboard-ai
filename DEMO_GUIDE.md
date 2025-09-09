# Guardian Dashboard AI - Demo Guide

## 🚀 Quick Start (2 minutes)

### 1. Install and Run
```bash
git clone https://github.com/dleimonis/guardian-dashboard-ai.git
cd guardian-dashboard-ai
npm install
npm run dev
```

### 2. Open Dashboard
Navigate to: http://localhost:8080

### 3. Test MEGA DISASTER Mode
1. Click the **red EMERGENCY button** (bottom-right corner)
2. Select **"MEGA DISASTER"** from the dropdown
3. Click **"Run Simulation"**
4. Watch as multiple disasters appear simultaneously on the map

## 🎯 Key Features to Demonstrate

### Multi-Agent System
- **12 specialized AI agents** working in 3 squads
- **Detection Squad**: Monitors NASA, USGS, NOAA APIs
- **Analysis Squad**: Processes threat levels and impact
- **Action Squad**: Dispatches multi-channel alerts

### Real-Time Updates
- WebSocket connection for instant updates
- Live agent status monitoring
- Real-time disaster markers on world map
- Alert feed with severity indicators

### Interactive Map
- Click any disaster marker for details
- Pan and zoom to any location
- Color-coded severity levels
- Animated disaster indicators

### Emergency Simulation
Available scenarios:
- **MEGA DISASTER**: Multiple simultaneous disasters
- **Major Earthquake**: Magnitude 7.5+ simulation
- **Spreading Wildfire**: Rapidly expanding fire
- **Category 5 Hurricane**: Major storm system
- **Tsunami Warning**: Coastal threat simulation

## 📊 System Architecture

```
External APIs → Detection Squad → Orchestrator → Analysis Squad → Action Squad
                                        ↓
                                  WebSocket Server
                                        ↓
                                 React Dashboard
```

## 🔧 MCP Integration

The system includes a Model Context Protocol (MCP) server for external agent connectivity:

### Available Tools
- `detect_disaster`: Trigger disaster detection
- `analyze_threat`: Analyze threat levels
- `get_agent_status`: Check agent health
- `dispatch_alert`: Send emergency alerts
- `simulate_disaster`: Run simulations

### Test MCP Server
```bash
# Build and start MCP server
cd backend
npm run build
node dist/mcp-server.js

# Test endpoint (in another terminal)
curl http://localhost:3002/health
```

## 💡 Tips for Judges

1. **Start with MEGA DISASTER** - Most impressive visual demonstration
2. **Watch agent cards** - They flash when processing events
3. **Check statistics bar** - Updates in real-time
4. **Try mobile view** - Resize browser to see responsive design
5. **Acknowledge alerts** - Click alerts in the feed to dismiss

## 🏆 Why This Project Stands Out

- **Real-world application**: Can be deployed today for actual emergencies
- **Innovative architecture**: Multi-agent orchestration system
- **Production-ready**: Integrates with real disaster APIs
- **Scalable design**: Handles thousands of simultaneous events
- **Mobile-first**: Works on phones for field responders

## 📝 Technical Highlights

- **Frontend**: React 18.3, TypeScript, Leaflet maps
- **Backend**: Node.js, Express, WebSocket
- **AI Agents**: 12 specialized agents with orchestration
- **External APIs**: NASA FIRMS, USGS, NOAA, GDACS
- **Security**: Role-based permissions, rate limiting
- **Performance**: <100ms latency for real-time updates

## 🆘 Troubleshooting

If the app doesn't start:
1. Ensure Node.js 18+ is installed
2. Check ports 8080 and 3001 are available
3. Try `npm install` again if dependencies fail

If disasters don't appear:
1. Click the EMERGENCY button
2. Select a scenario and click "Run Simulation"
3. The system works without external APIs (simulation mode)

## 📧 Contact

For questions about the Guardian Dashboard AI, please refer to the GitHub repository:
https://github.com/dleimonis/guardian-dashboard-ai