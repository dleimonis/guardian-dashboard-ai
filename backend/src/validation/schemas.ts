import { z } from 'zod';

// Disaster validation schemas
export const disasterSchemas = {
  getList: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
    type: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  getById: z.object({
    id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  }),
  
  update: z.object({
    status: z.enum(['active', 'monitoring', 'resolved']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    notes: z.string().max(1000).optional(),
  }),
};

// Alert validation schemas
export const alertSchemas = {
  create: z.object({
    type: z.string().min(1).max(50),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string().min(1).max(500),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      name: z.string().optional(),
    }),
    affectedArea: z.number().positive().optional(),
    estimatedImpact: z.number().int().positive().optional(),
  }),
  
  update: z.object({
    acknowledged: z.boolean().optional(),
    response: z.string().max(500).optional(),
    status: z.enum(['pending', 'acknowledged', 'resolved']).optional(),
  }),
  
  test: z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    type: z.string().optional(),
  }),
};

// Agent validation schemas
export const agentSchemas = {
  simulate: z.object({
    scenario: z.enum(['earthquake', 'fire', 'flood', 'mega_disaster']),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      name: z.string().optional(),
    }).optional(),
  }),
  
  restart: z.object({
    name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  }),
};

// User validation schemas
export const userSchemas = {
  updateProfile: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?[\d\s()-]+$/).max(20).optional(),
    emergencyContacts: z.array(z.object({
      name: z.string().min(1).max(100),
      phone: z.string().regex(/^\+?[\d\s()-]+$/).max(20),
      relationship: z.string().max(50).optional(),
    })).max(5).optional(),
  }),
  
  addLocation: z.object({
    name: z.string().min(1).max(100),
    address: z.string().min(1).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    type: z.enum(['home', 'work', 'family', 'other']),
    isPrimary: z.boolean().optional(),
  }),
  
  updateLocation: z.object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().min(1).max(200).optional(),
    isPrimary: z.boolean().optional(),
  }),
  
  updatePreferences: z.object({
    notifications: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
      severity: z.enum(['all', 'high', 'critical']).optional(),
    }).optional(),
    alertRadius: z.number().min(1).max(500).optional(),
    language: z.string().length(2).optional(),
    timezone: z.string().optional(),
  }),
};

// Community validation schemas
export const communitySchemas = {
  submitReport: z.object({
    type: z.string().min(1).max(50),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      address: z.string().optional(),
    }),
    description: z.string().min(10).max(1000),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    images: z.array(z.string().url()).max(5).optional(),
  }),
  
  updateReport: z.object({
    status: z.enum(['pending', 'verified', 'resolved', 'false']).optional(),
    verifiedBy: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
};

// Analytics validation schemas
export const analyticsSchemas = {
  getStats: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.string().optional(),
    region: z.string().optional(),
  }),
  
  getHeatmap: z.object({
    type: z.enum(['all', 'earthquake', 'fire', 'flood', 'hurricane']).optional(),
    days: z.coerce.number().int().min(1).max(365).optional().default(7),
  }),
};