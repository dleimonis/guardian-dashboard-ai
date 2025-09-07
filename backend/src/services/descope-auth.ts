import DescopeClient from '@descope/node-sdk';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

interface DescopeConfig {
  projectId: string;
  managementKey?: string;
}

interface ServiceToken {
  service: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export class DescopeAuthService {
  private client: any;
  private logger: Logger;
  private userTokens: Map<string, ServiceToken[]> = new Map();

  constructor(config: DescopeConfig, logger: Logger) {
    this.logger = logger;
    this.client = DescopeClient({ 
      projectId: config.projectId,
      managementKey: config.managementKey 
    });
  }

  /**
   * Middleware to validate Descope JWT tokens
   */
  async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const validated = await this.client.validateJwt(token);
      
      if (!validated) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Add user info to request
      (req as any).user = validated;
      next();
    } catch (error) {
      this.logger.error('Token validation error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  /**
   * Save API keys to Descope user custom attributes
   */
  async saveApiKeys(userId: string, apiKeys: Record<string, string>): Promise<void> {
    try {
      // Build custom attributes object
      const customAttributes: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(apiKeys)) {
        // Store each API key as a custom attribute
        customAttributes[key] = value;
        
        // Cache locally for quick access
        const userTokens = this.userTokens.get(userId) || [];
        const existingIndex = userTokens.findIndex(t => t.service === key);
        
        if (existingIndex >= 0) {
          userTokens[existingIndex].accessToken = value;
        } else {
          userTokens.push({
            service: key,
            accessToken: value,
          });
        }
        this.userTokens.set(userId, userTokens);
      }

      // Update user in Descope with API keys
      await this.client.management.user.update(userId, {
        customAttributes,
      });

      this.logger.info(`Successfully saved API keys for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to save API keys:', error);
      throw new Error('Failed to save API keys to Descope');
    }
  }

  /**
   * Get API key for a specific service
   */
  async getApiKey(userId: string, keyName: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.userTokens.get(userId);
      if (cached) {
        const token = cached.find(t => t.service === keyName);
        if (token) {
          return token.accessToken;
        }
      }

      // Fetch from Descope user attributes
      const user = await this.client.management.user.load(userId);
      const apiKey = user.customAttributes?.[keyName];

      if (apiKey) {
        // Cache for future use
        const userTokens = this.userTokens.get(userId) || [];
        userTokens.push({ service: keyName, accessToken: apiKey });
        this.userTokens.set(userId, userTokens);
        
        return apiKey;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get API key ${keyName}:`, error);
      return null;
    }
  }

  /**
   * Handle OAuth callback and store tokens via Descope
   */
  async handleOAuthCallback(service: string, code: string, userId: string): Promise<void> {
    try {
      // Exchange code for tokens (this would be service-specific)
      const tokens = await this.exchangeCodeForTokens(service, code);
      
      // Store tokens securely via Descope custom claims
      await this.client.management.user.update(userId, {
        customAttributes: {
          [`${service}_token`]: tokens.accessToken,
          [`${service}_refresh`]: tokens.refreshToken,
          [`${service}_expires`]: tokens.expiresAt,
        },
      });

      // Cache tokens locally for quick access
      const userTokens = this.userTokens.get(userId) || [];
      userTokens.push({
        service,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });
      this.userTokens.set(userId, userTokens);

      this.logger.info(`Successfully connected ${service} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to handle OAuth callback for ${service}:`, error);
      throw error;
    }
  }

  /**
   * Exchange OAuth code for access tokens
   */
  private async exchangeCodeForTokens(service: string, code: string): Promise<any> {
    // This would need service-specific implementation
    // For demo purposes, returning mock tokens
    return {
      accessToken: `mock_${service}_token_${Date.now()}`,
      refreshToken: `mock_${service}_refresh_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };
  }

  /**
   * Get API token for a specific service
   */
  async getServiceToken(userId: string, service: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.userTokens.get(userId);
      if (cached) {
        const token = cached.find(t => t.service === service);
        if (token && (!token.expiresAt || token.expiresAt > new Date())) {
          return token.accessToken;
        }
      }

      // Fetch from Descope user attributes
      const user = await this.client.management.user.load(userId);
      const tokenKey = `${service}_token`;
      const token = user.customAttributes?.[tokenKey];

      if (token) {
        // Cache for future use
        const userTokens = this.userTokens.get(userId) || [];
        userTokens.push({ service, accessToken: token });
        this.userTokens.set(userId, userTokens);
        
        return token;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get token for ${service}:`, error);
      return null;
    }
  }

  /**
   * Get all API tokens for a user
   */
  async getAllTokens(userId: string): Promise<Record<string, string>> {
    const services = [
      'NASA FIRMS API',
      'USGS Earthquake', 
      'NOAA Weather',
      'Twilio SMS',
      'SendGrid Email',
    ];

    const tokens: Record<string, string> = {};
    
    for (const service of services) {
      const token = await this.getServiceToken(userId, service);
      if (token) {
        tokens[service] = token;
      }
    }

    return tokens;
  }

  /**
   * Check if a service is connected for a user
   */
  async isServiceConnected(userId: string, service: string): Promise<boolean> {
    const token = await this.getServiceToken(userId, service);
    return token !== null;
  }

  /**
   * Refresh expired tokens
   */
  async refreshToken(userId: string, service: string): Promise<string | null> {
    try {
      const user = await this.client.management.user.load(userId);
      const refreshTokenKey = `${service}_refresh`;
      const refreshToken = user.customAttributes?.[refreshTokenKey];

      if (!refreshToken) {
        this.logger.warn(`No refresh token for ${service}`);
        return null;
      }

      // Service-specific token refresh logic would go here
      // For demo, generating new mock token
      const newToken = `refreshed_${service}_token_${Date.now()}`;
      
      // Update in Descope
      await this.client.management.user.update(userId, {
        customAttributes: {
          [`${service}_token`]: newToken,
          [`${service}_expires`]: new Date(Date.now() + 3600000),
        },
      });

      // Update cache
      const userTokens = this.userTokens.get(userId) || [];
      const tokenIndex = userTokens.findIndex(t => t.service === service);
      if (tokenIndex >= 0) {
        userTokens[tokenIndex].accessToken = newToken;
        userTokens[tokenIndex].expiresAt = new Date(Date.now() + 3600000);
      } else {
        userTokens.push({
          service,
          accessToken: newToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 3600000),
        });
      }
      this.userTokens.set(userId, userTokens);

      return newToken;
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${service}:`, error);
      return null;
    }
  }

  /**
   * Revoke a service connection
   */
  async revokeService(userId: string, service: string): Promise<void> {
    try {
      // Remove from Descope
      await this.client.management.user.update(userId, {
        customAttributes: {
          [`${service}_token`]: null,
          [`${service}_refresh`]: null,
          [`${service}_expires`]: null,
        },
      });

      // Remove from cache
      const userTokens = this.userTokens.get(userId);
      if (userTokens) {
        const filtered = userTokens.filter(t => t.service !== service);
        this.userTokens.set(userId, filtered);
      }

      this.logger.info(`Revoked ${service} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke ${service}:`, error);
      throw error;
    }
  }
}