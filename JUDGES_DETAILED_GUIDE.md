# 🎯 Guardian AI - Complete Judge Evaluation Guide

## 📋 Table of Contents
1. [Quick Setup (2 minutes)](#1-quick-setup-2-minutes)
2. [Core Features Walkthrough](#2-core-features-walkthrough)
3. [Testing the Multi-Agent System](#3-testing-the-multi-agent-system)
4. [Technical Evaluation Points](#4-technical-evaluation-points)
5. [MCP Hackathon Compliance](#5-mcp-hackathon-compliance)
6. [Troubleshooting Guide](#6-troubleshooting-guide)
7. [Evaluation Checklist](#7-evaluation-checklist)

---

## 1. Quick Setup (2 minutes)

### Option A: Instant Demo Mode (Recommended - No Setup)

```bash
# Step 1: Clone and navigate
git clone https://github.com/dleimonis/guardian-dashboard-ai.git
cd guardian-dashboard-ai

# Step 2: Install dependencies
npm install

# Step 3: Start the application
npm run dev

# Step 4: Open browser
Open: http://localhost:8080

# Step 5: Skip authentication
Click the "Skip to Demo Mode" button
```

**✅ You're now in the full system - no API keys needed!**

### Option B: Full Authentication Experience

If you want to test Descope integration:
1. Click "Get Started" instead of "Skip to Demo Mode"
2. Use any email to sign up (Descope test mode)
3. Complete the authentication flow
4. You'll be redirected to the dashboard

---

## 2. Core Features Walkthrough

### 🗺️ A. Interactive World Map (Center Panel)

**What You're Seeing:**
- **Real earthquake markers** from USGS (updated every 60 seconds)
- **Different colors** indicate severity:
  - 🔴 Red = Major (M5.0+)
  - 🟠 Orange = Moderate (M3.0-4.9)
  - 🟡 Yellow = Minor (M1.0-2.9)

**How to Test:**
1. **Hover** over any marker to see earthquake details
2. **Click** a marker for expanded information
3. **Zoom** in/out using mouse wheel or +/- buttons
4. **Pan** by clicking and dragging the map

**What to Look For:**
- Smooth map interactions
- Real-time data (check timestamp in tooltips)
- Responsive performance with many markers

### 🤖 B. Agent Status Panel (Right Side)

**What You're Seeing:**
- **12 AI Agents** organized into 3 squads:
  - **Detection Squad** (4 agents) - Monitor data sources
  - **Analysis Squad** (4 agents) - Process threats
  - **Action Squad** (3 agents) - Dispatch alerts
  - **Orchestrator** - Coordinates all agents

**Status Indicators:**
- 🟢 **Green pulse** = Online and working
- 🟡 **Yellow pulse** = Warning/Processing
- 🔴 **Red pulse** = Offline/Error

**How to Test:**
1. Watch the "Last Heartbeat" timestamps update
2. During simulations, observe status changes
3. Note the processing cycle (every 30-60 seconds)

### 🚨 C. Alert Feed (Left Panel)

**What You're Seeing:**
- Real-time disaster alerts
- Severity levels with color coding
- Location and timestamp for each alert

**How to Test:**
1. Run a simulation to generate alerts
2. Click "Acknowledge" to clear an alert
3. Watch the unread count badge update
4. Scroll to see historical alerts

### 📊 D. Statistics Bar (Top)

**Real-time Metrics:**
- **Active Emergencies** - Current disaster count
- **People Warned** - Notification count (simulated)
- **Response Time** - Average alert speed
- **System Status** - Overall health indicator

---

## 3. Testing the Multi-Agent System

### 🎮 Emergency Simulation Button (CRITICAL TEST)

**This is the most important feature to test!**

#### Step-by-Step Simulation:

1. **Locate the Red Button**
   - Bottom-right corner of screen
   - Pulsing red "EMERGENCY" button

2. **Click to Open Menu**
   - Modal appears with scenario options

3. **Select a Scenario:**
   
   **a) MEGA DISASTER (Recommended First)**
   - Tests maximum system capacity
   - Triggers all 12 agents simultaneously
   - Creates 5+ disasters at once
   - Best demonstrates coordination

   **b) Major Earthquake**
   - Magnitude 7.5 simulation
   - Tests seismic detection chain
   - Triggers tsunami warnings
   
   **c) Spreading Wildfire**
   - Rapid fire progression
   - Tests predictive analysis
   - Shows evacuation routing
   
   **d) Category 5 Hurricane**
   - Storm tracking simulation
   - Wind and surge predictions
   - Coastal impact analysis
   
   **e) Tsunami Warning**
   - Coastal threat simulation
   - Time-critical alerts
   - Zone-based warnings

4. **Click "Run Simulation"**

5. **Watch the System React:**
   - **Map**: New disaster markers appear instantly
   - **Agents**: Status changes to "warning" (yellow)
   - **Alerts**: Feed fills with new warnings
   - **Stats**: Numbers update in real-time
   - **WebSocket**: Messages flow (check DevTools)

#### What Success Looks Like:
- ✅ Disasters appear within 1-2 seconds
- ✅ All agents respond and change status
- ✅ Alerts are properly categorized
- ✅ No errors in browser console
- ✅ System remains responsive

### 🔄 Testing Agent Coordination

**After running a simulation:**

1. **Detection Phase** (0-2 seconds)
   - FireWatcher, QuakeDetector activate
   - "Detecting threat..." status

2. **Analysis Phase** (2-4 seconds)
   - ThreatAnalyzer processes severity
   - ImpactPredictor calculates zones
   - RouteCalculator finds escape paths

3. **Action Phase** (4-6 seconds)
   - AlertDispatcher sends warnings
   - NotificationManager queues messages
   - StatusReporter updates dashboard

---

## 4. Technical Evaluation Points

### 🏗️ Architecture Excellence

**Multi-Agent Design:**
```
Frontend (React) ←→ WebSocket ←→ Backend (Node.js)
                                    ↓
                            Agent Orchestrator
                            ↙      ↓       ↘
                    Detection  Analysis  Action
                    Squadron   Squadron  Squadron
```

**Key Innovations:**
1. **Event-Driven Architecture** - Agents communicate via events
2. **Message Queue System** - Asynchronous processing
3. **Fault Tolerance** - Agents continue if others fail
4. **Real-time Broadcasting** - WebSocket to all clients

### 🔒 Security Implementation

**Test These Security Features:**

1. **No Hardcoded Credentials**
   - Check `backend/.env.example` - only examples
   - Verify no API keys in source code
   - Demo mode works without keys

2. **Input Validation**
   - Try entering invalid data in forms
   - Check XSS protection (try `<script>alert('test')</script>`)
   - SQL injection prevention in place

3. **Rate Limiting**
   - API endpoints have rate limits
   - WebSocket connection limits
   - Prevents abuse

### 📱 Responsive Design

**Test on Different Devices:**
1. **Desktop** (1920x1080) - Full layout
2. **Tablet** (768px) - Responsive grid
3. **Mobile** (375px) - Mobile menu

**Use Chrome DevTools:**
- Press F12 → Toggle device toolbar
- Test iPhone 12 Pro, iPad, etc.

### ⚡ Performance Metrics

**What to Measure:**
1. **Page Load Time** - Should be < 3 seconds
2. **WebSocket Latency** - Check in Network tab
3. **Memory Usage** - Monitor in Performance tab
4. **CPU Usage** - Should remain < 50%

---

## 5. MCP Hackathon Compliance

### ✅ Descope Integration Checklist

**Required Features (All Implemented):**

- [x] **Authentication Flow**
  - Test by clicking "Get Started"
  - Descope widget appears
  - Can authenticate with email

- [x] **Zero Hardcoded Tokens**
  - No API keys in codebase
  - Environment variables only
  - Descope vault for storage

- [x] **Demo Mode Available**
  - "Skip to Demo Mode" button
  - Full functionality without auth
  - Perfect for quick testing

- [x] **Secure Token Management**
  - JWT tokens for sessions
  - Automatic refresh
  - Secure cookie storage

### 📝 Documentation Quality

**Verify These Documents Exist:**
- ✅ README.md - Comprehensive setup guide
- ✅ LICENSE - MIT license included
- ✅ HACKATHON_SUBMISSION.md - Submission details
- ✅ API documentation in code
- ✅ Agent documentation

---

## 6. Troubleshooting Guide

### 🐛 Common Issues and Solutions

#### Issue: "npm install" fails
```bash
# Solution 1: Clear npm cache
npm cache clean --force
npm install

# Solution 2: Delete node_modules
rm -rf node_modules package-lock.json
npm install

# Solution 3: Use npm 8+
npm --version  # Should be 8.0.0 or higher
```

#### Issue: Port 8080 or 3001 already in use
```bash
# Find and kill the process
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8080
kill -9 <PID>

# Or change ports in package.json
```

#### Issue: No earthquakes showing on map
- **Wait 5-10 seconds** for USGS data to load
- **Check browser console** for errors
- **Verify internet connection** (needs USGS API)
- **Try refreshing** the page

#### Issue: Agents showing offline
- **Normal on first load** - wait 10 seconds
- **Check backend** is running (port 3001)
- **Look for errors** in terminal
- **Restart** with `npm run dev`

#### Issue: Emergency button not working
- **Ensure in Demo Mode** (or authenticated)
- **Check browser console** for errors
- **Try different browser** (Chrome recommended)
- **Clear browser cache** and retry

#### Issue: WebSocket disconnected
- **Auto-reconnects** every 5 seconds
- **Check Network tab** in DevTools
- **Verify backend** is running
- **Look for CORS errors**

---

## 7. Evaluation Checklist

### 📋 Quick Evaluation (5 minutes)

**Functionality Tests:**
- [ ] Application loads successfully
- [ ] "Skip to Demo Mode" works
- [ ] Map displays with earthquake markers
- [ ] Agents show as online (green dots)
- [ ] Emergency button opens modal
- [ ] MEGA DISASTER simulation runs
- [ ] Alerts appear in feed
- [ ] Statistics update in real-time
- [ ] No console errors

### 🔍 Detailed Evaluation (15 minutes)

**Technical Excellence:**
- [ ] Multi-agent architecture working
- [ ] Real-time WebSocket updates
- [ ] Responsive on mobile/tablet
- [ ] Descope integration present
- [ ] No hardcoded credentials
- [ ] Clean code structure
- [ ] Comprehensive documentation
- [ ] Error handling implemented
- [ ] Performance acceptable

**Innovation Points:**
- [ ] First-of-its-kind multi-agent system
- [ ] Real disaster data integration
- [ ] Autonomous agent coordination
- [ ] Production-ready architecture
- [ ] Scalable design

**Impact Assessment:**
- [ ] Solves real problem (disaster response)
- [ ] Could save lives if deployed
- [ ] Ready for production use
- [ ] Open source contribution
- [ ] Teen-appropriate complexity

---

## 📞 Quick Reference

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development
npm run build        # Build for production
npm start            # Start production
```

### URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001/ws

### Key Files
- `src/` - React frontend
- `backend/src/agents/` - AI agents
- `backend/src/routes/` - API endpoints
- `.env.example` - Environment template

### Browser Tools
- **Console** (F12) - Check for errors
- **Network** - Monitor API/WebSocket
- **Performance** - Check memory/CPU
- **Application** - View storage/cookies

---

## 🎯 Final Notes for Judges

### Why Guardian AI Stands Out:

1. **Complete Implementation** - Not a prototype, fully functional
2. **Real Data** - Live USGS earthquakes, not mock data
3. **Production Ready** - Security, error handling, documentation
4. **Innovative Architecture** - True multi-agent coordination
5. **Impact Potential** - Could actually save lives

### Testing Priority:
1. **MUST TEST**: Emergency Button → MEGA DISASTER
2. **SHOULD TEST**: Different disaster scenarios
3. **NICE TO TEST**: Descope authentication flow

### Time Estimates:
- **Minimum viable test**: 2 minutes
- **Recommended test**: 5-10 minutes
- **Comprehensive review**: 15-20 minutes

---

**Thank you for taking the time to properly evaluate Guardian AI!**

*Built with ❤️ by a teenager for the MCP Hackathon*

**Questions?** Check the README.md or the codebase - it's well documented!