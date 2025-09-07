# 🚀 Deployment Guide - Guardian Dashboard AI

## Current Status
- **Frontend**: Deployed on Lovable (auto-deployed from GitHub)
- **Backend**: Ready for deployment (Railway/Render recommended)

## Backend Deployment Options

### Option 1: Railway (Recommended)
Railway offers the easiest deployment with WebSocket support and free credits.

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect GitHub Repository**
   - Click "New Project" → "Deploy from GitHub"
   - Select `guardian-dashboard-ai` repository
   - Choose `/backend` as the root directory

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   DESCOPE_PROJECT_ID=P31sYu11ghqKWlnCob2qq2n9fvcN
   DESCOPE_MANAGEMENT_KEY=(leave empty for demo)
   FRONTEND_URL=https://your-lovable-url.app
   ```

4. **Deploy**
   - Railway will auto-detect Node.js and use `railway.json`
   - Deployment takes ~3-5 minutes
   - Copy the deployed URL (e.g., `https://guardian-backend.railway.app`)

### Option 2: Render
Free tier available with some limitations.

1. **Sign up at [Render.com](https://render.com)**
2. **New Web Service**
   - Connect GitHub repository
   - Select `guardian-dashboard-ai`
   - Root Directory: `backend`

3. **Configure**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables (same as Railway)

4. **Deploy**
   - Click "Create Web Service"
   - Copy the deployed URL

### Option 3: Quick Deploy with Glitch
For immediate demo without GitHub.

1. **Go to [Glitch.com](https://glitch.com)**
2. **New Project → Import from GitHub**
3. **Configure `.env`**
4. **Your app is live!**

## Frontend Configuration Update

After backend deployment, update the frontend:

1. **Update Frontend Environment**
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_WS_URL=wss://your-backend-url.railway.app/ws
   ```

2. **Rebuild Frontend**
   - Push changes to GitHub
   - Lovable will auto-deploy

## Testing Deployed Application

### 1. Test Backend Health
```bash
curl https://your-backend-url.railway.app/health
```

### 2. Test Agent Status
```bash
curl https://your-backend-url.railway.app/api/agents/status
```

### 3. Test WebSocket Connection
```javascript
const ws = new WebSocket('wss://your-backend-url.railway.app/ws');
ws.onopen = () => console.log('Connected!');
```

### 4. Test Emergency Simulation
```bash
curl -X POST https://your-backend-url.railway.app/api/agents/simulate \
  -H "Content-Type: application/json" \
  -d '{"scenario": "earthquake_major"}'
```

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend environment updated with backend URL
- [ ] WebSocket connection working
- [ ] All 11 agents showing online
- [ ] Emergency simulation functioning
- [ ] CORS configured for Lovable domain
- [ ] Health endpoint responding

## Environment Variables Reference

### Required
- `NODE_ENV`: production
- `PORT`: Usually auto-set by platform
- `DESCOPE_PROJECT_ID`: P31sYu11ghqKWlnCob2qq2n9fvcN

### Optional
- `DESCOPE_MANAGEMENT_KEY`: For full auth (can be empty for demo)
- `FRONTEND_URL`: Your Lovable URL (for CORS)

### API URLs (Already Configured)
- NASA FIRMS: Public endpoint
- USGS: Public endpoint
- NOAA: Public endpoint

## Troubleshooting

### Backend Won't Start
- Check build logs for TypeScript errors
- Verify all dependencies in package.json
- Ensure PORT environment variable is set

### WebSocket Connection Failed
- Check CORS configuration includes frontend URL
- Verify WSS protocol for secure connections
- Ensure `/ws` path is accessible

### Agents Not Working
- Check API endpoints are accessible
- Verify no rate limiting from external APIs
- Check agent logs in deployment console

## Demo URLs

Once deployed, your URLs will be:
- **Frontend**: `https://[your-project].lovable.app`
- **Backend API**: `https://[your-project].railway.app`
- **WebSocket**: `wss://[your-project].railway.app/ws`

## Support

For deployment issues:
- Railway: [docs.railway.app](https://docs.railway.app)
- Render: [render.com/docs](https://render.com/docs)
- Lovable: Check deployment logs in dashboard

---

**Ready for hackathon submission! 🎉**