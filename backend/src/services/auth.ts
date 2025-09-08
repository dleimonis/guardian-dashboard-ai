import DescopeClient from '@descope/node-sdk';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
  };
}

export class DescopeAuthService {
  private descope: any;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    
    const projectId = process.env.DESCOPE_PROJECT_ID;
    const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;

    if (!projectId || !managementKey) {
      this.logger.warn('Descope credentials not configured. Authentication will be disabled.');
      return;
    }

    try {
      this.descope = DescopeClient({
        projectId,
        managementKey,
      });
      this.logger.info('Descope authentication service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Descope:', error);
    }
  }

  /**
   * Middleware to verify JWT tokens from Descope
   */
  public authenticateToken() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Skip authentication in development if Descope is not configured
      if (!this.descope && process.env.NODE_ENV === 'development') {
        req.user = {
          userId: 'dev_user',
          email: 'dev@guardian.ai',
          name: 'Development User',
          roles: ['user'], // Changed from 'admin' to 'user' for security
          permissions: ['read'],
        };
        return next();
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      try {
        const authInfo = await this.verifyToken(token);
        
        req.user = {
          userId: authInfo.userId,
          email: authInfo.email,
          name: authInfo.name,
          roles: authInfo.roles || [],
          permissions: authInfo.permissions || [],
        };

        next();
      } catch (error) {
        this.logger.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    };
  }

  /**
   * Verify a JWT token with Descope
   */
  private async verifyToken(token: string) {
    if (!this.descope) {
      throw new Error('Descope not initialized');
    }

    try {
      const authInfo = await this.descope.validateJWT(token);
      return authInfo;
    } catch (error) {
      this.logger.error('Descope token validation failed:', error);
      throw error;
    }
  }

  /**
   * Middleware to check if user has required role
   */
  public requireRole(role: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.user.roles || !req.user.roles.includes(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  /**
   * Middleware to check if user has required permission
   */
  public requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }

  /**
   * Create a new user in Descope
   */
  public async createUser(email: string, name: string, phone?: string) {
    if (!this.descope) {
      throw new Error('Descope not initialized');
    }

    try {
      const user = await this.descope.management.user.create({
        email,
        displayName: name,
        phone,
        roles: ['user'], // Default role
      });

      this.logger.info(`User created in Descope: ${email}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user in Descope:', error);
      throw error;
    }
  }

  /**
   * Update user profile in Descope
   */
  public async updateUserProfile(userId: string, updates: any) {
    if (!this.descope) {
      throw new Error('Descope not initialized');
    }

    try {
      const user = await this.descope.management.user.update(userId, updates);
      this.logger.info(`User profile updated: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Add notification preferences to user
   */
  public async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      alertTypes?: string[];
      severityLevels?: string[];
    }
  ) {
    if (!this.descope) {
      this.logger.warn('Descope not initialized, storing preferences locally');
      // Could store in a local database instead
      return preferences;
    }

    try {
      const customAttributes = {
        notificationPreferences: JSON.stringify(preferences),
      };

      await this.descope.management.user.update(userId, {
        customAttributes,
      });

      this.logger.info(`Notification preferences updated for user: ${userId}`);
      return preferences;
    } catch (error) {
      this.logger.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get user's notification preferences
   */
  public async getNotificationPreferences(userId: string) {
    if (!this.descope) {
      // Return default preferences if Descope is not configured
      return {
        email: true,
        sms: false,
        push: true,
        alertTypes: ['all'],
        severityLevels: ['critical', 'warning'],
      };
    }

    try {
      const user = await this.descope.management.user.load(userId);
      
      if (user.customAttributes?.notificationPreferences) {
        return JSON.parse(user.customAttributes.notificationPreferences);
      }

      // Return defaults if no preferences are set
      return {
        email: true,
        sms: false,
        push: true,
        alertTypes: ['all'],
        severityLevels: ['critical', 'warning'],
      };
    } catch (error) {
      this.logger.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Initialize OAuth flow for social login
   */
  public async initiateSocialLogin(provider: 'google' | 'facebook' | 'github') {
    if (!this.descope) {
      throw new Error('Descope not initialized');
    }

    try {
      const authUrl = await this.descope.oauth.start(provider, {
        redirectUrl: `${process.env.FRONTEND_URL}/auth/callback`,
      });

      return authUrl;
    } catch (error) {
      this.logger.error('Failed to initiate social login:', error);
      throw error;
    }
  }

  /**
   * Complete OAuth flow
   */
  public async completeSocialLogin(code: string) {
    if (!this.descope) {
      throw new Error('Descope not initialized');
    }

    try {
      const authInfo = await this.descope.oauth.exchange(code);
      return authInfo;
    } catch (error) {
      this.logger.error('Failed to complete social login:', error);
      throw error;
    }
  }
}