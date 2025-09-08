import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import winston from 'winston';

// Input sanitization patterns
const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|JAVASCRIPT|EVAL)\b)|(--)|(;)|(')|(")|(\*)|(%)/gi;
const XSS_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>|<iframe[\s\S]*?>[\s\S]*?<\/iframe>|javascript:|on\w+\s*=/gi;
const PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/g;

/**
 * Sanitize input string to prevent injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  // Remove potential SQL injection patterns
  let sanitized = input.replace(SQL_INJECTION_PATTERN, '');
  
  // Remove potential XSS patterns
  sanitized = sanitized.replace(XSS_PATTERN, '');
  
  // Remove path traversal attempts
  sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERN, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent buffer overflow
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
};

/**
 * Recursively sanitize all string values in an object
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      req.body = sanitizeObject(req.body);
      
      // Validate against schema
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(400).json({
        error: 'Invalid request body',
      });
    }
  };
};

/**
 * Middleware to validate request query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      req.query = sanitizeObject(req.query);
      
      // Validate against schema
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(400).json({
        error: 'Invalid query parameters',
      });
    }
  };
};

/**
 * Middleware to validate request parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      req.params = sanitizeObject(req.params);
      
      // Validate against schema
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      return res.status(400).json({
        error: 'Invalid URL parameters',
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID validation
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
  
  // Email validation
  email: z.string().email().max(255),
  
  // Name validation
  name: z.string().min(1).max(100),
  
  // Phone validation
  phone: z.string().regex(/^\+?[\d\s()-]+$/, 'Invalid phone format').max(20),
  
  // Coordinates validation
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.string().regex(/^[a-zA-Z_]+$/, 'Invalid sort field'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Severity levels
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  
  // Disaster types
  disasterType: z.enum(['earthquake', 'fire', 'flood', 'hurricane', 'tornado', 'volcano', 'tsunami', 'other']),
};

/**
 * Middleware to log validation failures
 */
export const logValidationFailures = (logger: winston.Logger) => {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        errors: err.errors,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    next(err);
  };
};

/**
 * Middleware to sanitize all incoming requests
 */
export const sanitizeAllInputs = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};