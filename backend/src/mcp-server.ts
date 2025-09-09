import express from 'express';
import { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { createLogger } from './utils/logger.js';
import { DescopeAuthService } from './services/descope-auth.js';
import rateLimit from 'express-rate-limit';

const logger = createLogger('mcp-server');
const orchestrator = new AgentOrchestrator();
const authService = new DescopeAuthService(logger);

// Security middleware for MCP endpoints
const mcpAuthMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Validate token and get user permissions
    const mockReq = { headers: { authorization: `Bearer ${token}` } } as any;
    const mockRes = { status: (code: number) => ({ json: (data: any) => ({ statusCode: code, data }) }) } as any;
    let user: any = null;
    const mockNext = (error?: any) => {
      if (error) throw error;
      user = (mockReq as any).user;
    };

    await authService.validateToken(mockReq, mockRes, mockNext);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check permissions based on user role
    req.user = user;
    req.permissions = getUserPermissions(user);
    next();
  } catch (error) {
    logger.error('MCP authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Get user permissions based on role
function getUserPermissions(user: any): string[] {
  const role = user.customAttributes?.role || 'viewer';
  const permissionMap: Record<string, string[]> = {
    admin: ['*'],
    detection_squad: ['detect_disaster', 'get_agent_status'],
    analysis_squad: ['analyze_threat', 'get_agent_status'],
    action_squad: ['dispatch_alert', 'get_agent_status'],
    viewer: ['get_agent_status']
  };
  return permissionMap[role] || ['get_agent_status'];
}

// Rate limiting configurations per tool
const rateLimiters: Record<string, any> = {
  detect_disaster: rateLimit({
    windowMs: 60000,
    max: 100,
    message: 'Too many detection requests'
  }),
  analyze_threat: rateLimit({
    windowMs: 60000,
    max: 200,
    message: 'Too many analysis requests'
  }),
  dispatch_alert: rateLimit({
    windowMs: 60000,
    max: 50,
    message: 'Too many alert dispatch requests'
  }),
  simulate_disaster: rateLimit({
    windowMs: 60000,
    max: 10,
    message: 'Too many simulation requests'
  })
};

// Initialize MCP Server
async function initializeMCPServer() {
  const server = new MCPServer(
    {
      name: 'guardian-dashboard-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Tool: Detect Disaster
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'detect_disaster') {
      const { location, radius = 50, disasterTypes = ['all'] } = request.params.arguments as any;
      
      try {
        // Trigger detection agents
        const detectionAgents = orchestrator.getAgentsBySquad('detection');
        const results = [];

        for (const agent of detectionAgents) {
          if (disasterTypes.includes('all') || disasterTypes.includes(agent.type)) {
            const detection = await agent.detectInArea(location, radius);
            if (detection) results.push(detection);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                detectionsFound: results.length,
                results
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Detection error:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Detection failed', details: error.message })
            }
          ]
        };
      }
    }

    // Tool: Analyze Threat
    if (request.params.name === 'analyze_threat') {
      const { disasterId, includeEvacuation = true, priorityThreshold = 'medium' } = request.params.arguments as any;
      
      try {
        const analysisAgents = orchestrator.getAgentsBySquad('analysis');
        const analysis = {
          threatLevel: null,
          impact: null,
          evacuationRoutes: null,
          priority: null
        };

        // Run analysis through each agent
        for (const agent of analysisAgents) {
          const result = await agent.analyze({ disasterId, threshold: priorityThreshold });
          Object.assign(analysis, result);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                disasterId,
                analysis
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Analysis error:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Analysis failed', details: error.message })
            }
          ]
        };
      }
    }

    // Tool: Dispatch Alert
    if (request.params.name === 'dispatch_alert') {
      const { alertType, channels = ['all'], message, affectedZones = [] } = request.params.arguments as any;
      
      try {
        const actionAgents = orchestrator.getAgentsBySquad('action');
        const dispatchResults = [];

        for (const agent of actionAgents) {
          const result = await agent.dispatch({
            type: alertType,
            channels,
            message,
            zones: affectedZones
          });
          dispatchResults.push(result);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                alertsDispatched: dispatchResults.length,
                results: dispatchResults
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Alert dispatch error:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Alert dispatch failed', details: error.message })
            }
          ]
        };
      }
    }

    // Tool: Simulate Disaster
    if (request.params.name === 'simulate_disaster') {
      const { scenario, intensity = 'medium' } = request.params.arguments as any;
      
      try {
        const simulation = await orchestrator.runSimulation(scenario, intensity);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                scenario,
                intensity,
                simulation
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Simulation error:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Simulation failed', details: error.message })
            }
          ]
        };
      }
    }

    // Tool: Get Agent Status
    if (request.params.name === 'get_agent_status') {
      const { squad = 'all' } = request.params.arguments as any;
      
      try {
        const agents = squad === 'all' 
          ? orchestrator.getAllAgents() 
          : orchestrator.getAgentsBySquad(squad);
        
        const statuses = agents.map(agent => ({
          name: agent.name,
          squad: agent.squad,
          status: agent.status,
          lastActivity: agent.lastActivity,
          health: agent.health
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                agentCount: statuses.length,
                agents: statuses
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Status check error:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Status check failed', details: error.message })
            }
          ]
        };
      }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Resource: Active Disasters
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'disaster://active',
          name: 'Active Disasters',
          description: 'List of currently active disasters being monitored',
          mimeType: 'application/json'
        },
        {
          uri: 'alert://recent',
          name: 'Recent Alerts',
          description: 'Recent emergency alerts dispatched by the system',
          mimeType: 'application/json'
        },
        {
          uri: 'agent://status',
          name: 'Agent Status',
          description: 'Current status and health of all AI agents',
          mimeType: 'application/json'
        },
        {
          uri: 'statistics://dashboard',
          name: 'System Statistics',
          description: 'Real-time system performance and disaster statistics',
          mimeType: 'application/json'
        }
      ]
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === 'disaster://active') {
      const disasters = await orchestrator.getActiveDisasters();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(disasters, null, 2)
          }
        ]
      };
    }

    if (uri === 'alert://recent') {
      const alerts = await orchestrator.getRecentAlerts();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(alerts, null, 2)
          }
        ]
      };
    }

    if (uri === 'agent://status') {
      const status = orchestrator.getAllAgentStatus();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    }

    if (uri === 'statistics://dashboard') {
      const stats = await orchestrator.getSystemStatistics();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2)
          }
        ]
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'emergency_response',
          description: 'Generate emergency response plan for a disaster',
          arguments: [
            {
              name: 'disasterType',
              description: 'Type of disaster',
              required: true
            },
            {
              name: 'severity',
              description: 'Severity level (1-10)',
              required: true
            },
            {
              name: 'location',
              description: 'Affected location',
              required: true
            }
          ]
        },
        {
          name: 'evacuation_plan',
          description: 'Create evacuation plan for affected areas',
          arguments: [
            {
              name: 'zones',
              description: 'Affected zones requiring evacuation',
              required: true
            },
            {
              name: 'population',
              description: 'Estimated population to evacuate',
              required: false
            }
          ]
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'emergency_response') {
      const { disasterType, severity, location } = args as any;
      return {
        description: 'Generate emergency response plan',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create an emergency response plan for a ${disasterType} disaster with severity ${severity}/10 at ${location}. Include:
1. Immediate actions required
2. Resource allocation
3. Evacuation procedures
4. Communication protocols
5. Recovery timeline`
            }
          }
        ]
      };
    }

    if (name === 'evacuation_plan') {
      const { zones, population = 'unknown' } = args as any;
      return {
        description: 'Create evacuation plan',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Design an evacuation plan for zones: ${zones}. Estimated population: ${population}. Include:
1. Evacuation routes and assembly points
2. Transportation requirements
3. Timeline and phases
4. Special needs considerations
5. Communication plan`
            }
          }
        ]
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Express app for HTTP-based MCP access
  const app = express();
  app.use(express.json());

  // MCP endpoint with authentication and rate limiting
  app.post('/mcp/:tool', mcpAuthMiddleware, async (req, res) => {
    const { tool } = req.params;
    const permissions = req.permissions;

    // Check permissions
    if (!permissions.includes('*') && !permissions.includes(tool)) {
      return res.status(403).json({ error: 'Permission denied for this tool' });
    }

    // Apply rate limiting
    const limiter = rateLimiters[tool];
    if (limiter) {
      limiter(req, res, async () => {
        try {
          // Process the tool request
          const result = await server.handleRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: tool,
              arguments: req.body
            },
            id: Date.now()
          });
          res.json(result);
        } catch (error) {
          logger.error(`MCP tool error for ${tool}:`, error);
          res.status(500).json({ error: 'Tool execution failed' });
        }
      });
    } else {
      res.status(404).json({ error: 'Unknown tool' });
    }
  });

  // MCP token endpoint for authentication
  app.post('/api/auth/mcp/token', async (req, res) => {
    try {
      const { apiKey, role } = req.body;
      
      // Validate API key and generate MCP-specific token
      const token = await authService.generateMCPToken(apiKey, role);
      
      res.json({
        token,
        expiresIn: 3600,
        permissions: getUserPermissions({ customAttributes: { role } })
      });
    } catch (error) {
      logger.error('MCP token generation error:', error);
      res.status(401).json({ error: 'Invalid API key' });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      mcp: true,
      agents: orchestrator.getAllAgentStatus().map(a => ({
        name: a.name,
        status: a.status
      }))
    });
  });

  const PORT = process.env.MCP_PORT || 3002;
  app.listen(PORT, () => {
    logger.info(`MCP Server running on port ${PORT}`);
  });

  // Also support stdio transport for direct MCP connections
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Server started with stdio transport');
}

// Initialize and start the server
initializeMCPServer().catch((error) => {
  logger.error('Failed to start MCP server:', error);
  process.exit(1);
});