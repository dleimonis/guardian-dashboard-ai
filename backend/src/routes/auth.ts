import express from 'express';
import { DescopeAuthService } from '../services/descope-auth';
import { Logger } from 'winston';

export function createAuthRoutes(authService: DescopeAuthService, logger: Logger) {
  const router = express.Router();

  /**
   * POST /api/auth/verify
   * Verify Descope JWT token and return user profile
   */
  router.post('/verify', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // The validateToken method from DescopeAuthService validates the JWT
      // We'll create a mock request object to use the existing middleware
      const mockReq = {
        headers: { authorization: `Bearer ${token}` }
      } as express.Request;

      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => ({ statusCode: code, data })
        })
      } as any;

      let userInfo: any = null;
      const mockNext = (error?: any) => {
        if (error) throw error;
        userInfo = (mockReq as any).user;
      };

      await authService.validateToken(mockReq, mockRes, mockNext);
      
      if (userInfo) {
        res.json({
          success: true,
          user: userInfo,
          message: 'Token verified successfully'
        });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  });

  /**
   * GET /api/auth/profile
   * Get user profile (requires authentication)
   */
  router.get('/profile', authService.validateToken.bind(authService), async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Get connected services for the user
      const connectedServices = await authService.getAllTokens(user.sub);
      
      res.json({
        user: {
          id: user.sub,
          email: user.email,
          name: user.name,
          loginIds: user.loginIds,
        },
        connectedServices: Object.keys(connectedServices),
        serviceCount: Object.keys(connectedServices).length
      });
    } catch (error) {
      logger.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  /**
   * POST /api/auth/api-keys
   * Store user API keys (Demo mode accepts without validation for hackathon)
   */
  router.post('/api-keys', async (req, res) => {
    try {
      const { apiKeys } = req.body;

      if (!apiKeys || typeof apiKeys !== 'object') {
        return res.status(400).json({ error: 'API keys object is required' });
      }

      // In demo mode for hackathon, just acknowledge the save
      if (!process.env.DESCOPE_MANAGEMENT_KEY) {
        logger.info('Demo mode: API keys simulated save', Object.keys(apiKeys));
        return res.json({
          success: true,
          message: 'API keys saved successfully (demo mode)',
          savedKeys: Object.keys(apiKeys),
          demoMode: true
        });
      }

      // Production mode with actual Descope
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const mockReq = { headers: { authorization: `Bearer ${token}` } } as any;
      const mockRes = { status: (code: number) => ({ json: (data: any) => ({ statusCode: code, data }) }) } as any;
      let user: any = null;
      const mockNext = (error?: any) => {
        if (error) throw error;
        user = (mockReq as any).user;
      };

      await authService.validateToken(mockReq, mockRes, mockNext);
      
      if (user) {
        await authService.saveApiKeys(user.sub, apiKeys);
        res.json({
          success: true,
          message: 'API keys saved successfully',
          savedKeys: Object.keys(apiKeys)
        });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      logger.error('API keys save error:', error);
      res.status(500).json({ error: 'Failed to save API keys' });
    }
  });

  /**
   * GET /api/auth/api-keys
   * Get user API keys (Demo mode returns empty for hackathon)
   */
  router.get('/api-keys', async (req, res) => {
    try {
      // In demo mode for hackathon, return empty keys
      if (!process.env.DESCOPE_MANAGEMENT_KEY) {
        return res.json({
          success: true,
          apiKeys: {},
          connectedServices: [],
          demoMode: true
        });
      }

      // Production mode with actual Descope
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const mockReq = { headers: { authorization: `Bearer ${token}` } } as any;
      const mockRes = { status: (code: number) => ({ json: (data: any) => ({ statusCode: code, data }) }) } as any;
      let user: any = null;
      const mockNext = (error?: any) => {
        if (error) throw error;
        user = (mockReq as any).user;
      };

      await authService.validateToken(mockReq, mockRes, mockNext);
      
      if (user) {
        const tokens = await authService.getAllTokens(user.sub);
        res.json({
          success: true,
          apiKeys: tokens,
          connectedServices: Object.keys(tokens)
        });
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      logger.error('API keys fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  /**
   * DELETE /api/auth/api-keys/:service
   * Revoke a specific service connection
   */
  router.delete('/api-keys/:service', authService.validateToken.bind(authService), async (req, res) => {
    try {
      const user = (req as any).user;
      const { service } = req.params;

      await authService.revokeService(user.sub, service);
      
      res.json({
        success: true,
        message: `${service} connection revoked successfully`
      });
    } catch (error) {
      logger.error('Service revocation error:', error);
      res.status(500).json({ error: 'Failed to revoke service' });
    }
  });

  /**
   * GET /api/auth/services/:service/status
   * Check if a service is connected
   */
  router.get('/services/:service/status', authService.validateToken.bind(authService), async (req, res) => {
    try {
      const user = (req as any).user;
      const { service } = req.params;

      const isConnected = await authService.isServiceConnected(user.sub, service);
      
      res.json({
        service,
        connected: isConnected,
        userId: user.sub
      });
    } catch (error) {
      logger.error('Service status check error:', error);
      res.status(500).json({ error: 'Failed to check service status' });
    }
  });

  return router;
}