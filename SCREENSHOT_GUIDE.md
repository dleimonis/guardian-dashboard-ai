# Screenshot Guide for Guardian AI Demo

## Essential Screenshots for Submission

### 1. Landing Page Hero
**Filename:** `screenshot-1-landing.png`
- **What to capture:** Full landing page with hero section
- **Key elements:** Logo, tagline, "Get Started" button, feature cards
- **Browser:** Chrome incognito mode, 1920x1080
- **Notes:** Ensure smooth gradient background is visible

### 2. Main Dashboard Overview
**Filename:** `screenshot-2-dashboard.png`
- **What to capture:** Full dashboard with world map
- **Key elements:** 
  - Interactive map with earthquake markers
  - Agent status panel on the right
  - Statistics bar at top
  - Alert feed on the left
- **Setup:** Wait for real earthquake data to load
- **Highlight:** Hover over an earthquake marker to show tooltip

### 3. Agent Status Panel
**Filename:** `screenshot-3-agents.png`
- **What to capture:** Close-up of agent status cards
- **Key elements:**
  - All 12 agents visible
  - Green "online" status indicators
  - Squad organization (Detection, Analysis, Action)
- **Notes:** Ensure all agents show as "online" with green dots

### 4. Emergency Button Menu
**Filename:** `screenshot-4-emergency-menu.png`
- **What to capture:** Emergency simulation dropdown open
- **Key elements:**
  - Red EMERGENCY button clicked
  - Dropdown showing all scenarios
  - MEGA DISASTER option visible
- **Action:** Click emergency button but don't run simulation yet

### 5. Active Simulation
**Filename:** `screenshot-5-simulation.png`
- **What to capture:** Dashboard during active simulation
- **Setup:** Run "MEGA DISASTER" simulation
- **Key elements:**
  - Multiple disaster markers on map
  - Alert feed filling with warnings
  - Agents showing "warning" status
  - Statistics updating
- **Timing:** Capture 2-3 seconds after simulation starts

### 6. Alert Feed Detail
**Filename:** `screenshot-6-alerts.png`
- **What to capture:** Close-up of alert feed
- **Key elements:**
  - Multiple alerts with different severity levels
  - Critical (red), Warning (orange), Watch (yellow)
  - Acknowledge buttons
  - Timestamps and locations
- **Setup:** After running simulation

### 7. Real-Time Statistics
**Filename:** `screenshot-7-statistics.png`
- **What to capture:** Statistics bar during active emergency
- **Key elements:**
  - Active emergencies count
  - People warned metric
  - Response time
  - System status (Online)
- **Notes:** Capture when numbers are actively changing

### 8. Authentication Flow (Optional)
**Filename:** `screenshot-8-auth.png`
- **What to capture:** Descope authentication screen
- **Key elements:**
  - Descope Flow widget
  - "Skip to Demo Mode" button
- **Notes:** Shows MCP compliance with Descope

### 9. Mobile Responsive View
**Filename:** `screenshot-9-mobile.png`
- **What to capture:** Dashboard on mobile device
- **Browser:** Chrome DevTools mobile view (iPhone 12 Pro)
- **Key elements:** Responsive layout, hamburger menu
- **Notes:** Shows mobile compatibility

### 10. Architecture Diagram
**Filename:** `screenshot-10-architecture.png`
- **What to capture:** From presentation slide 4
- **How:** Open hackathon-presentation.html, navigate to slide 4
- **Key elements:** Three squad boxes with agent names

## Screenshot Tips

### Browser Setup
1. Use Chrome in incognito mode
2. Disable all extensions
3. Set zoom to 100%
4. Clear browser cache before starting

### Quality Settings
- **Resolution:** 1920x1080 minimum
- **Format:** PNG for best quality
- **Tool:** Windows Snipping Tool or ShareX
- **Compression:** Use TinyPNG if files are too large

### Timing Guidelines
1. **Landing Page:** Immediate capture
2. **Dashboard:** Wait 5 seconds for data to load
3. **Simulation:** Capture 2-3 seconds after triggering
4. **Agents:** Ensure all show recent heartbeat times

### What to Avoid
- Personal information in screenshots
- Browser bookmarks or tabs
- Desktop notifications
- Error messages or console logs
- Incomplete data loading

## Quick Screenshot Workflow

```bash
# 1. Start the application
cd guardian-dashboard-ai
npm run dev

# 2. Open browser in incognito
# Chrome: Ctrl+Shift+N

# 3. Navigate to http://localhost:8080

# 4. Take screenshots in order:
# - Landing page
# - Click "Skip to Demo Mode"
# - Main dashboard (wait for data)
# - Click Emergency button
# - Select MEGA DISASTER
# - Run simulation
# - Capture active state
# - Close emergency modal
# - Capture agent details
# - Capture alert feed

# 5. Open presentation for architecture
# Open hackathon-presentation.html
# Navigate to slide 4
# Screenshot the architecture diagram
```

## File Organization

Create a folder structure:
```
screenshots/
├── main/
│   ├── screenshot-1-landing.png
│   ├── screenshot-2-dashboard.png
│   ├── screenshot-3-agents.png
│   ├── screenshot-4-emergency-menu.png
│   └── screenshot-5-simulation.png
├── details/
│   ├── screenshot-6-alerts.png
│   ├── screenshot-7-statistics.png
│   └── screenshot-8-auth.png
└── extras/
    ├── screenshot-9-mobile.png
    └── screenshot-10-architecture.png
```

## Submission Package

For hackathon submission, include:
1. **Primary Screenshots (1-5):** Show core functionality
2. **Detail Screenshots (6-7):** Demonstrate real-time features
3. **Architecture (10):** Explain system design
4. **Optional (8-9):** If space permits

## Video Recording Notes

If recording video instead of screenshots:
- Use OBS Studio or similar
- Record at 1920x1080, 30fps
- Follow video-demo-script.md
- Keep total length under 3 minutes
- Export as MP4, H.264 codec
- Upload to YouTube as unlisted if needed

---

Remember: The goal is to show Guardian AI saving lives through intelligent automation!