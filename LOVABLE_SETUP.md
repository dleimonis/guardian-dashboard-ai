# 🚀 Lovable Deployment Instructions

## Quick Setup for Demo

### Option 1: Demo Mode (Recommended for Hackathon)
The app works in **demo mode** without any backend! Perfect for testing.

1. **Import to Lovable**
   - Go to [lovable.dev](https://lovable.dev)
   - Import from GitHub: `https://github.com/dleimonis/guardian-dashboard-ai`
   - Lovable will auto-deploy

2. **No Configuration Needed!**
   - The app includes demo data
   - All 11 agents show as "online"
   - Emergency simulations work
   - No API keys required

### Option 2: Full Deployment (With Backend)

1. **Deploy Backend to Railway**
   ```
   1. Go to railway.app
   2. Deploy from GitHub
   3. Set root directory: /backend
   4. Add environment variables:
      NODE_ENV=production
      PORT=3001
      DESCOPE_PROJECT_ID=P31sYu11ghqKWlnCob2qq2n9fvcN
   ```

2. **Update Lovable Environment**
   In Lovable settings, add:
   ```
   VITE_API_URL=https://your-backend.railway.app
   VITE_WS_URL=wss://your-backend.railway.app/ws
   ```

## Demo Features Available

### Without Backend (Demo Mode):
- ✅ All 11 agents show online status
- ✅ Sample disasters on map
- ✅ Emergency simulation button works
- ✅ Statistics display
- ✅ Alert feed active

### With Backend (Full Mode):
- ✅ Real-time WebSocket updates
- ✅ Live disaster detection
- ✅ Agent orchestration
- ✅ Database persistence
- ✅ API integrations

## Testing the Demo

1. **Open the app** - Should load immediately
2. **Check agent status** - All 11 agents should be "online"
3. **Click Emergency Button** - Select "MEGA DISASTER"
4. **Watch the magic** - Alerts appear on map!

## Hackathon Judges Notes

- **No setup required** - Works immediately
- **Demo mode active** - Full functionality
- **All features visible** - Nothing hidden
- **Mobile responsive** - Test on any device

## Support

- GitHub: https://github.com/dleimonis/guardian-dashboard-ai
- Demo: [Your Lovable URL]

---

**Ready for the hackathon! 🏆**